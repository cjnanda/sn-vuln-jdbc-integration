/**
 * Integration script to run and kick off the JDBC import.  Wrapper methods to create the JDBC import, and then also to check for integration runs that are associated
 * with the assigned integration.
 */

var R7JDBCIntegration = Class.create();
R7JDBCIntegration.prototype = {
	/**
	 * This is the sys_id of the Vulnerability Integration that this integration is being used on.  This needs to change based
	 * on the integration that is created. (Will come up with a better solution later).
	 */
	_integration: "9feb875d4f83cf8031f9f7e18110c761",
    initialize: function() {
    },
	
	/**
	 * Kicks off the JDBC integration probe
	 */
	processStart: function(){
		var prId = this._startPull();
	},
	
	/**
	 * Processes the waiting integration runs.  This will query the ECC queue for a JDBCProbeCompleted result, signaling it has finished.
	 * Then will loop through each ECC queue record, and pass that record to the R7JDBCResultProcessor.processECCQueueRecord 
	 */
	processWaitingIntegrations: function(){
		//Loop through the integrations with the parameter state of "waiting" and check if there is a result.
		var runs = new GlideRecord("sn_vul_integration_run");
		//runs.addQuery("parameters", "contains", "waiting");
		//runs.addQuery("state", "running");
		runs.addQuery("integration", this._integration);
		runs.query();
		
		
		while(runs.next()){
			if(runs.parameters.nil())
				continue;
			
			var parms = JSON.parse(runs.parameters.toString());
			if(parms.state == "complete")
				continue;
			
			gs.info("Found waiting run, checking for completion: " + runs.number);
			var eccRec = new GlideRecord("ecc_queue");
			eccRec.addQuery("response_to", parms.probe_id);
			eccRec.addQuery("topic", "JDBCProbeCompleted");
			eccRec.query();
			
			if(eccRec.next()){
				gs.info("Is complete: " + runs.number);
				//this one has completed.  Update the run parms to be processing, and process the results
				parms.state = "creating_import_records";
				runs.parameters = JSON.stringify(parms);
				runs.update();
				
				//Loop through the ECC queue results
				eccRec = new GlideRecord("ecc_queue");
				eccRec.addQuery("response_to", parms.probe_id);
				eccRec.addQuery("agent", "JDBCProbeResult");
				eccRec.addQuery("state", "ready");
				eccRec.orderBy("name");
				eccRec.query();
				gs.info("Result Rows: " + eccRec.getRowCount());
				while(eccRec.next()){
					//Creates the integration process and the import queue records
					
					R7JDBCResultProcessor.get().processECCQueueRecord(eccRec);
					eccRec.state = "processed";
					eccRec.update();
					this._waitOneSecond();
					
				}
				parms.state = "complete";
				runs.parameters = JSON.stringify(parms);
				runs.update();
			}
			else{
				gs.info("Not complete: " + runs.number);
			}
		}
	
	},
	
	/**
	 * Since we do not have access to gs.wait, this is used to wait a period of time.  This is needed to ensure we do not
	 * have race conditions when generating Import Queue records, due to how the Vulnerability application selects a data source.
	 */
	_waitOneSecond: function(){
		var time = new GlideDateTime().getNumericValue();
		var endTime = time + 2000;
		while(time < endTime){
			time = new GlideDateTime().getNumericValue();
		}
	},
	
	/**
	 * THIS NEEDS TO BE UPDATED BASED ON INTEGRATION
	 * This generates a new JDBCProbe object, passing in the mid server name.
	 * It also generates the integration run record for this integration. 
	 * 
	 * 
	 */
	_startPull: function(){
		var run = new GlideRecord("sn_vul_integration_run");
		run.integration = this._integration;
		run.state = "running";
		var id = run.insert();
		gs.info(id);

		var probe =new JDBCProbe(gs.getProperty("x_opt_rapid7_data.mid_server_name"));
		// if(gs.getProperty("x_opt_rapid7_data.full_sync", false) == "true")
		// 	probe.setDataSource(gs.getProperty("x_opt_rapid7_data.vulnerable_item_full_sync_ds"));
		// else
		// 	probe.setDataSource(gs.getProperty("x_opt_rapid7_data.vulnerable_item_delta_ds"));
		probe.addParameter("skip_sensor", "true");
		probe.addParameter("integration_run", id);
		probe.addParameter("r7_jdbc_integration", "true");
		var prId = probe.create();
		gs.info(prId);
		
		run.parameters = JSON.stringify({probe_id: prId, state: "waiting"});
		run.update();
		return prId;
	},
	

    type: 'R7JDBCIntegration'
};
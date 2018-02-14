/**
 * This script is called to process a single ECC queue record.  It does NOT check to ensure that record is for the integration, that check is done in 
 * R7JDBCIntegration script include.
 */

var R7JDBCResultProcessor = Class.create();
R7JDBCResultProcessor.prototype = {
    initialize: function() {
    },
	
	/**
	 * Get the integration run number off the payload document, create an Integration Process record for 
	 * with a parameter containing the ecc queue record.
	 */
	processECCQueueRecord: function(record){
		if(record.agent.toString() == "JDBCProbeResult"){
			
			var xmlDoc = R7JDBCResultProcessor.getPayloadXMLDoc(record);
			if(xmlDoc == null)
				throw "Error parsing ECC queue payload.";
			
			var iRunNode = xmlDoc.getNode("//results/parameters/parameter[@name='integration_run']");
			var iRun = iRunNode.getAttribute("value");

			var processRun = new GlideRecord("sn_vul_integration_process");
			processRun.parameters = JSON.stringify({ecc_queue_id: record.sys_id.toString()});
			processRun.integration_run = iRun;
			processRun.insert();
		}else if(record.topic.toString() == "JDBCProbeCompleted"){
			//Handle the end of the run
		}
		
		
		//record.state = "processed";
		
	},

    type: 'R7JDBCResultProcessor'
};

/**
 * Get's the payload from the ECC queue, wheter it is in an attachment or a string.
 */
R7JDBCResultProcessor.getPayloadXMLDoc = function(record){
	var xmlDoc = null;
	if(record.payload.toString() == "<see_attachment/>"){
		gs.info("Is attachment.")
		var att = new GlideRecord("sys_attachment");
		att.addQuery("table_sys_id", record.sys_id.toString());
		att.query();
		gs.info(att.getRowCount());
		if(att.next()){
			var gsa = new GlideSysAttachment();
			var stream = gsa.getContentStream(att.sys_id.toString());
			xmlDoc = new XMLDocument2(stream);
		}
		
	}else{
		xmlDoc = new XMLDocument2();
		xmlDoc.parseXML(record.payload.toString());
	}
	return xmlDoc;
};

/**
 * Get's the attachment stream from an ecc queue record that has an attachment.
 * (Using streams is the preferred way to deal with attachments, especially varying in size)
 */
R7JDBCResultProcessor.getAttachmentStreamForRecord = function(record){
	var att = new GlideRecord("sys_attachment");
	att.addQuery("table_sys_id", record.sys_id.toString());
	att.query();
	if(att.next()){
		var gsa = new GlideSysAttachment();
		return gsa.getContentStream(att.sys_id.toString());

	}
	return null;
};

/**
 * Factory method to create the Result Processor.
 */
R7JDBCResultProcessor.get = function(){
		return new R7JDBCResultProcessor();
};

/**
 * Deprecated method to check to see if this is a valid probe result.  Was used when running in BR on ECC queue.
 */
R7JDBCResultProcessor.isR7JDBCProbeResult = function(record){

	if(record.topic.toString() != "JDBCProbe" && record.topic.toString() != "JDBCProbeCompleted")
		return false;
		
	var xmlDoc = R7JDBCResultProcessor.getPayloadXMLDoc(record);
	if(xmlDoc == null)
				return false;
			
	var iRunNode = xmlDoc.getNode("//results/parameters/parameter[@name='r7_jdbc_integration']");
	var iRun = iRunNode != null ? iRunNode.getAttribute("value") : null;

	if(iRun)
		return true;
	
	return false;
	
};
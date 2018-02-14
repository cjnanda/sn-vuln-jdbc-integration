/**
 * This is the Integration script (referenced by the integration record you create)
 * It will handle taking the ECC Queue record referenced in the Integration Process parameters field (set during ECC Queue processing)
 * and copy the attachment from the ECC Queue record (or the value in the payload) and attach it to the Integration Process record. 
 * Then returns an object with the attachmentId, 
 */

var R7VulnIntegrationTest = Class.create();
R7VulnIntegrationTest.prototype = Object.extendsObject(sn_vul.VulnerabilityIntegrationBase, {
	

	/**
	 * Gets the ecc queue record sys_id out of the parameters on the integration process and copies the attachment to the
	 * integration process record, and returns an object with the attachment id.
	 */
	retrieveData: function() {		
		var parms = this.integrationProcessGr.parameters;
		var parmObj = JSON.parse(parms);
		
		var gr = new GlideRecord("ecc_queue");
		gr.get(parmObj.ecc_queue_id.toString());
		
			var gsa = new GlideSysAttachment(); 
		var attachmentId = null;
		var fileName = this.integrationGr.name + "_" + new GlideDateTime().toString() + ".xml";
		if(gr.payload.toString() == "<see_attachment/>"){
			var eccStream = R7JDBCResultProcessor.getAttachmentStreamForRecord(gr);
			
			attachmentId =  gsa.writeContentStream(this.integrationProcessGr, fileName, 'xml', eccStream);
		}else{
			
			attachmentId = gsa.write(this.integrationProcessGr, fileName, 'xml', gr.payload);
		}
		var obj = {contents: attachmentId, contentType: "sys_attachment", extension: "xml"};
	
		return obj;
	},
	
	

    type: 'R7VulnIntegrationTest'
});
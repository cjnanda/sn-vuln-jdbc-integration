gs.include("PrototypeServer");

var JDBCProbe = Class.create();
JDBCProbe.prototype = {
  initialize : function(mid_server) {
    this.midServer = mid_server;
    this.name = "JDBCProbe"; // optional probe name
   // this.payloadDoc = new GlideXMLDocument("parameters");
	var xml = new XMLDocument2();
	  xml.parseXML("<parameters></parameters>");
	   this.payloadDoc = xml;
    this.farray = {};
    this.fNarray = {};
    this.functionName = null;
    this.tableName;
    this.whereClause;
    this.dataSource;
    this.agent_correlator = gs.generateGUID();
  },

  setName : function(name) {
    this.name = name;
  },

  addParameter : function(name, value) {
    var el = this.payloadDoc.createElement("parameter");
    el.setAttribute("name", name);

    if (value)
      el.setAttribute("value", value);

    return el;
  },

  setDriver : function(driver) {
    this.addParameter("jdbc_driver", driver);
  },

  setDriverJar : function(driverJar) {
    this.addParameter("jdbc_driver_jar", driverJar);
  },

  setConnectionString : function(connectionStr) {
    this.addParameter("connection_string", connectionStr);
  },

  setAgentCorrelator : function(agentCorrelator) {
    this.agent_correlator = agentCorrelator;
  },

  addField : function(name, value) {
    this.farray[name] = value;
  },

  addNumberField : function(name, value) {
    this.fNarray[name] = value;
  },

  setFunction : function(f) {
    this.functionName = f;
  },

  setWhereClause : function(w) {
    this.whereClause = w;
  },

  setTable : function(t) {
    this.tableName = t;
  },

  setDataSource : function(source) {
    this.dataSource = source;
  },

  create : function() {
    var egr = new GlideRecord("ecc_queue");
    egr.agent = "mid.server." + this.midServer;
    egr.queue = "output";
    egr.state = "ready";
    egr.topic = "JDBCProbe";
    egr.name = this.name;
    egr.agent_correlator = this.agent_correlator;

    if (this.dataSource) {
      egr.source = this.dataSource;
    }

    if (this.functionName) {
      var workEl = this.addParameter("work");
      this.payloadDoc.setCurrentElement(workEl);
      var funcEl = this.payloadDoc.createElement(this.functionName);
      funcEl.setAttribute("table", this.tableName);

      if (this.whereClause) {
        funcEl.setAttribute("where", this.whereClause);
      }

      this.payloadDoc.setCurrentElement(funcEl);
      for(nextKey in this.farray) {
        var v = this.farray[nextKey];
        var el = this.payloadDoc.createElementWithTextValue(nextKey, v);
      }

      for(nextKey in this.fNarray) {
        var v = this.fNarray[nextKey];
        var el = this.payloadDoc.createElementWithTextValue(nextKey, v);
        el.setAttribute("quoted", "false");
      }
    }

    egr.payload = this.payloadDoc.toString();
    return egr.insert();
  },

  type: 'JDBCProbe'
};
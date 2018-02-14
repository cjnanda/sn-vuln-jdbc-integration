var JDBCHelper = Class.create();
JDBCHelper.prototype = {

    limit: 10,
    offset: 0,
    hasMore: true,
    datasource: false,
    midserver: false,
    database: false,
    port: false,
    username: false,
    password: false,
    server: false,
    sql: false,
    ds: false,
    xml: false,
    param: false,


    initialize: function(datasourceID) {
        if(typeof datasourceID !== "undefined") {
            this.datasource = datasourceID;
            this._setupFromDataSource();
        }
    },

    _setupFromDataSource: function(datasourceID) {
        if(typeof datasourceID !== "undefined")
            this.datasource = datasourceID;
        if(this.datasource === false)
            return false;
        this.ds = new GlideRecord("sys_data_source");
        if(!this.ds.get("sys_id", this.datasource))
            return false;

    },

    _query: function(sql, limit, offset) {
        if(typeof sql === "undefined") {
            if(sql === false) {
                if(this.ds === false)
                    return false;
                if(this.ds.sql_statement == "")
                    return false;
                sql = String(this.ds.sql_statement);
            }
        }
        if(typeof limit === "undefined") {
            limit = this.limit;
        }
        if(typeof offset === "undefined") {
            offset = this.offset;
        }
        var xml = this._buildQuery(sql, limit, offset);

        if(this.ds === false)
            return false


        var ecc = new GlideRecord("ecc_queue");
        ecc.newRecord();
        ecc.agent = "mid.server."+this.ds.mid_server.getDisplayValue();
        ecc.topic = "JDBCProbe";
        ecc.queue = "output";
        ecc.payload = xml;
        ecc.source = this.ds.sys_id;
        ecc.agent_correlator = gs.generateGUID();
        ecc.insert();

    },

    _buildQuery: function(sql, limit, offset) {
        if(typeof sql === "undefined") {
            if(this.sql === false) {
                if(this.ds === false)
                    return false;
                if(this.ds.sql_statement == "")
                    return false;
                sql = String(this.ds.sql_statement);
            }
            else
                sql = this.sql;
        }
        if(typeof limit === "undefined") {
            limit = this.limit;
        }
        if(typeof offset === "undefined") {
            offset = this.offset;
        }

        sql = sql.split("limit")[0];

        this.xml = new XMLDocument2();
        this.param = this.xml.createElement("parameters");

        if(this.datasource !== false)
            this._addParameter("source", this.datasource);

        if(this.ds !== false) {
            this._addParameter("jdbc_driver", String(this.ds.format));

            var url = String(this.ds.connection_url);
            if(url.indexOf("?") >= 0)
                url += "&";
            else
                url += "?";
            url += "user="+String(this.ds.jdbc_user_name);
            url +=  "&password="+String(this.ds.jdbc_password.getDecryptedValue());
            this._addParameter("connection_string", String(url));
            this._addParameter("jdbc_user_name", String(this.ds.jdbc_user_name));
            this._addParameter("jdbc_password", String(this.ds.jdbc_password.getDecryptedValue()));
        }

        if(sql === "")
            return false;

        sql += " limit "+limit;
        sql += " offset "+offset;
        this.offset += limit;

        this._addParameter("query", "Specific SQL");
        this._addParameter("sql_statement", sql);
        return this.param.toString();
    },

    _addParameter: function(name, value, param) {
        if(typeof param === "undefined") {
            param = this.param;
            if(param === false)
                return false;
        }
        this.xml.setCurrentElement(param);
        var el = this.xml.createElement("parameter");
        el.setAttribute("name", name);
        el.setAttribute("value", value);
    },

    setDatasource: function(datasource) {
        this.datasource = String(datasource);
    },

    getDatasource: function() {
        return this.datasource;
    },

    setMidserver: function(midserver) {
        this.midserver = String(midserver);
    },

    getMidserver: function() {
        return this.midserver;
    },

    setDatabase: function(database) {
        this.database = String(database);
    },

    getDatabase: function() {
        return this.database;
    },

    setServer: function(server) {
        this.server = String(server);
    },

    getServer: function() {
        return this.server;
    },

    setUsername: function(username) {
        this.username = String(username);
    },

    getUsername: function() {
        return this.username;
    },

    setPassword: function(password) {
        this.password = String(password);
    },

    getPassword: function() {
        return this.password;
    },

    setCredentials: function(username, password) {
        this.username = String(username);
        this.password = String(password);
    },

    getCredentials: function() {
        return {username: this.username, password: this.password};
    },





    /*
     * log() <br />
     * Used to log items for debugging purposes.
     */
    log: function(msg, override) {
        if(this.prefix === "") {
            this.prefix = "" + Math.floor(Math.random()*1001);
        }
        if (this.debugFlag || (typeof override !== "undefined" && override)){
            this.logCounter++;
            var str = "" + this.logCounter;
            if(this.scoped)
                gs.info("("+this.prefix+" -- "+this.logPad.substring(0, this.logPad.length - str.length) + str+")  - "+msg);
            else
                gs.log("("+this.prefix+" -- "+this.logPad.substring(0, this.logPad.length - str.length) + str+")  - "+msg, this.type);
        }
    },

    /*
     * log() <br />
     * Used to log items for debugging purposes.
     */
    error: function(msg) {
        if(this.prefix === "") {
            this.prefix = "" + Math.floor(Math.random()*101);
        }
        if (this.errorFlag){
            this.logCounter++;
            var str = "" + this.logCounter;
            if(this.scoped)
                gs.error("("+this.prefix+" -- "+this.logPad.substring(0, this.logPad.length - str.length) + str+")  - "+msg);
            else
                gs.logError("("+this.prefix+" -- "+this.logPad.substring(0, this.logPad.length - str.length) + str+")  - "+msg, this.type);
        }
    },

    logTiming: function() {
        var end = new Date().getTime();
        if(this.theLastTime === 0)
            this.theLastTime = end;
        if(this.theBeginTime === 0)
            this.theBeginTime = end;
        var sectionTime = end-this.theLastTime;
        var totalTime = end - this.theBeginTime;
        this.log('Section Time: ' + sectionTime+"\nTotal Time: "+totalTime, true);
        this.theLastTime = end;
    },

    errorFlag: true,
    debugFlag: true,
    scoped: true,
    logCounter: 0,
    logPad: "00000",
    prefix: "",
    theBeginTime: 0,
    theLastTime: 0,
    type: 'JDBCHelper'
};
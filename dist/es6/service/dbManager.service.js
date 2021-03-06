'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DbManagerService = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global Pormise:false*/


var _dbDumpService = require('./dbDump.service.js');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DbManagerService = function () {
  DbManagerService.$inject = ["ngDexieAdminConfig"];
  function DbManagerService(ngDexieAdminConfig) {
    'ngInject';

    _classCallCheck(this, DbManagerService);

    this.config(ngDexieAdminConfig);
    this.previsouSearch = "";
    this.onRefresh = function () {};
  }

  _createClass(DbManagerService, [{
    key: 'config',
    value: function config(_config) {
      this.config = _config;
      this.db = _config.getDb();
      this.tables = this.orderTables(this.db.tables);
      this.dbDump = new _dbDumpService.DbDump();
      this.dbDump.config({
        db: this.db
      });
      var actionsLoad = this.resolveConfigType('load');
      this.actionsLoad = actionsLoad;
      this.context = _config.context;
      if (_config.onNewDb) {
        this.onNewDb = _config.onNewDb();
      }
    }
  }, {
    key: 'getTables',
    value: function getTables() {
      return this.tables;
    }
  }, {
    key: 'orderTables',
    value: function orderTables(tables) {
      var confOrder = this.resolveConfigType('order');
      var tableOrder = [];
      for (var key in confOrder) {
        tableOrder.push({ name: key, order: confOrder[key] });
      }
      tableOrder.sort(function (a, b) {
        return b.order - a.order;
      });
      tableOrder.map(function (order) {
        var index = tables.findIndex(function (t) {
          return t.name == order.name;
        });
        var table = tables.splice(index, 1)[0];
        tables.unshift(table);
      });
      return tables;
    }
  }, {
    key: 'columnsToDisplay',
    value: function columnsToDisplay(tableName) {
      return this.resolveConfigType('columns')[tableName];
    }
  }, {
    key: 'displayEditConfig',
    value: function displayEditConfig(tableName) {
      var conf = this.resolveConfigType('displayEdit');
      if (conf) {
        return conf[tableName];
      }
      return null;
    }
  }, {
    key: 'fieldsConfig',
    value: function fieldsConfig(tableName) {
      var conf = this.resolveConfigType('fields');
      if (conf) {
        return conf[tableName];
      }
      return null;
    }
  }, {
    key: 'resolveColumns',
    value: function resolveColumns(table) {
      var columns = this.columnsToDisplay(table.name);
      if (!columns) {
        columns = {};
      }
      table.schema.indexes.forEach(function (indexe) {
        if (columns[indexe.name] === undefined) {
          columns[indexe.name] = true;
        }
      });
      var columnsToDisplay = [];
      columnsToDisplay = Object.keys(columns).filter(function (key) {
        var conf = columns[key];
        if (conf === false) {
          return false;
        }
        return true;
      });
      return columnsToDisplay;
    }
  }, {
    key: 'buildData',
    value: function buildData(table) {
      var selectedTableIndexes = this.resolveColumns(table);
      var dottedIndexes = selectedTableIndexes.filter(function (inedex) {
        return inedex.includes(".");
      });
      var indexes = [];
      dottedIndexes.forEach(function (indexe) {
        indexes.push({
          key: indexe,
          value: indexe.split('.')
        });
      });
      return table.toArray().then(function (list) {
        list.map(function (data) {
          indexes.forEach(function (indexe) {
            var key = indexe.key;
            var value = indexe.value;

            data[key] = value.reduce(function (obj, key) {
              return obj[key] ? obj[key] : '';
            }, data);
          });
          return data;
        });
        return list;
      }).then(function (list) {
        return list;
      });
    }
  }, {
    key: 'resolveConfigType',
    value: function resolveConfigType(type) {
      var _this = this;

      var config = {};
      if (this.config.tablesConfig) {
        Object.keys(this.config.tablesConfig()).forEach(function (table) {
          var tableConfig = _this.config.tablesConfig()[table];
          if (tableConfig && tableConfig[type] != undefined) {
            config[table] = tableConfig[type];
          }
        });
      }
      return config;
    }
  }, {
    key: 'configOnRefresh',
    value: function configOnRefresh(call) {
      this.onRefresh = call;
    }
  }, {
    key: 'hasActionLoad',
    value: function hasActionLoad(table) {
      return this.resolveActionLoad(table);
    }
  }, {
    key: 'hasDelete',
    value: function hasDelete(table) {
      var trashConfig = this.resolveConfigType('noDelete');
      if (trashConfig[table.name] === false || trashConfig[table.name] === undefined) {
        return true;
      }
      return false;
    }
  }, {
    key: 'resolveActionLoad',
    value: function resolveActionLoad(table) {
      return this.actionsLoad[table.name];
    }
  }, {
    key: 'deleteAllTable',
    value: function deleteAllTable() {
      var _this2 = this;

      return Promise.all(this.tables.map(function (table) {
        return _this2.hasDelete(table) ? _this2.delete(table) : false;
      }));
    }
  }, {
    key: 'add',
    value: function add(table, objet) {
      return table.put(objet);
    }
  }, {
    key: 'save',
    value: function save(table, objet) {
      return table.put(objet);
    }
  }, {
    key: 'deleteObject',
    value: function deleteObject(table, object) {
      var pk = this.primaryKeyName(table);
      return table.delete(object[pk]);
    }
  }, {
    key: 'delete',
    value: function _delete(table, ids) {
      var _this3 = this;

      var promise = new Promise(function () {});
      if (table && !ids) {
        promise = table.clear();
      } else if (table && ids) {
        promise = table.bulkDelete(ids);
      }
      return promise.then(function () {
        return _this3.countTupleTable(table);
      }).then(function () {
        return _this3.onRefresh();
      });
    }
  }, {
    key: 'loadAll',
    value: function loadAll() {
      var _this4 = this;

      return Promise.all(this.tables.map(function (table) {
        return _this4.load(table);
      }));
    }
  }, {
    key: 'load',
    value: function load(table) {
      var _this5 = this;

      var action = this.resolveActionLoad(table);
      if (action) {
        var promise = this.context ? action.call(this.context) : action(),
            self = this;
        if (promise && promise.then) {
          return promise.then(function () {
            return self.countTupleTable(table);
          }).then(function () {
            return _this5.onRefresh();
          });
        } else {
          return new Pormise(function () {
            _this5.countTupleTable(table);
            _this5.onRefresh();
          });
        }
      }
    }
  }, {
    key: 'createDb',
    value: function createDb() {
      var db = new Dexie(this.dbDump.dbName + "ddd");
      db.version(1).stores(this.dbDump.tableDef);
      return db;
    }
  }, {
    key: 'drop',
    value: function drop() {
      var _this6 = this;

      return this.db.delete().then(function () {
        return _this6.createDb();
      }).then(function (db) {
        db.open().then(function () {
          _this6.db = db;
          _this6.tables = db.tables;
          if (_this6.onNewDb) {
            _this6.onNewDb(_this6.db);
          }
          _this6.dbDump.config({
            db: db
          });
          _this6.countTupleForEachTable();
        });
      });
    }
  }, {
    key: 'dumpAsSting',
    value: function dumpAsSting(tablesToExclude) {
      return this.dbDump.dump(tablesToExclude);
    }
  }, {
    key: 'dump',
    value: function dump(tablesToExclude) {
      var _this7 = this;

      return this.dbDump.dump().then(function (dump) {
        return _this7.createFileAndDowload(dump);
      });
    }
  }, {
    key: 'dumpTable',
    value: function dumpTable(talbe) {
      var _this8 = this;

      return this.dbDump.dumpTable(talbe).then(function (dump) {
        return _this8.createFileAndDowload(dump);
      });
    }
  }, {
    key: 'countTupleForEachTable',
    value: function countTupleForEachTable() {
      var _this9 = this;

      var i = 0;
      var size = this.tables.length;
      var f = function f() {
        if (i < size) {
          _this9.countTupleTable(_this9.tables[i]).then(function () {
            i++;
            f();
          });
        } else {
          _this9.onRefresh();
        }
      };
      f();
    }
  }, {
    key: 'countTupleTable',
    value: function countTupleTable(table) {
      return table.count().then(function (nb) {
        table.nbRow = nb;
      });
    }
  }, {
    key: 'primaryKeyName',
    value: function primaryKeyName(table) {
      return table.schema.primKey.name;
    }
  }, {
    key: 'search',
    value: function search(textSearch, table) {
      var _this10 = this;

      var search = textSearch.toUpperCase();
      if (search.indexOf(":") == 0) {
        var _ret = function () {
          var t = search.substr(1).split("=");
          if (t.length > 1) {
            var _ret2 = function () {
              var key = t[0].trim().toLowerCase();
              return {
                v: {
                  v: _this10.buildData(table).then(function (list) {
                    if (list[0][key]) {
                      list = list.filter(function (v) {
                        var value = v[key];
                        if (!isNaN(parseFloat(value)) && isFinite(value)) {
                          return value == t[1] * 1;
                        } else {
                          return value.toUpperCase().includes(t[1]);
                        }
                      });
                    }
                    return list;
                  })
                }
              };
            }();

            if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
          }
          return {
            v: new Promise(function () {})
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return this.buildData(table).then(function (list) {
          list = list.map(function (v) {
            v.valstring = _this10.valuesToString(v);
            return v;
          }).filter(function (v) {
            return v.valstring.includes(search);
          });
          return list;
        });
      }
    }
  }, {
    key: 'createFileAndDowload',
    value: function createFileAndDowload(text) {
      var data = new Blob([text], {
        type: 'text/plain'
      });
      var url = window.URL.createObjectURL(data);
      var a = document.createElement('a');
      a.style.display = "none";
      a.href = url;
      a.download = "dump_" + new Date().getTime() + ".txt";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 50);
    }
  }, {
    key: 'valuesToString',
    value: function valuesToString(obj) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var val = obj[key];
          if (val instanceof Object) {
            values = values + this.valuesToString(val);
          } else {
            values = values + ' ' + obj[key];
          }
        }
      }
      return values.toUpperCase();
    }
  }, {
    key: 'tableParser',
    value: function tableParser(obj, path) {
      var s = path.replace(/^\./, ''); // strip a leading dot
      var a = s.split('.');
      var currentPaht = "";
      var t = [];
      var o = obj;
      for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        currentPaht = currentPaht + (currentPaht ? "." : "") + k;
        //"t[].child[].age")
        if (k in o) {
          o = o[k];
        } else if (k.indexOf('[]')) {
          k = k.replace('[]', '');
          t.push(o[k].length);
          o = o[k][0];
          for (var j = 0; j < o.length; j++) {
            //console.log(o[i]);
            this.tableParser(o[i], currentPaht);
          }
        }
      }
      return t;
    }
  }]);

  return DbManagerService;
}();

exports.DbManagerService = DbManagerService;
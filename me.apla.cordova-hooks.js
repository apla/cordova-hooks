var libxml  = require ('libxmljs');
var plist   = require('plist');
var fs      = require ('fs');
var path    = require ('path');
var cordova_util  = require('cordova/src/util');


module.exports = {
	getCordovaConfig: function () {
		if (!this.projectConfig) {
			var projectRoot = cordova_util.isCordova(process.cwd());
			var projectXml  = cordova_util.projectConfig(projectRoot);
			this.projectConfig = new cordova_util.config_parser(projectXml);
			console.log ("Loaded project config for " + this.projectConfig.name());
		}
		return this.projectConfig;	
	},
	getPreferences: function (preferenceNames, singleVar) {
		var projectConfig = this.getCordovaConfig();

		

		if (typeof preferenceNames == "string") {
			preferenceNames = [preferenceNames];
		}

		var result = {};

		preferenceNames.forEach (function (preferenceName) {
			result[preferenceName] = null;
		});

		projectConfig.preference.get().forEach (function (preferenceNode) {
			if (preferenceNode.name in result) {
				result[preferenceNode.name] = new String (preferenceNode.value);
				// result[preferenceNode.name].targetDevice = preferenceNode["gap:target-device"];
			}
		});

		if (singleVar) {
			return result[preferenceNames[0]];
		}

		return result;
	},
	getPreference: function (preferenceName) {
		return this.getPreferences (preferenceName, true);
	},
	parseXML: function (configFileName) {
		var configContents = fs.readFileSync (configFileName);

		var doc = libxml.parseXmlString (configContents);
		return doc;
	},
	parsePlist: function (configFileName) {
		var obj = plist.parseFileSync (configFileName);
		return obj;
	},
	getObjectByPath: function (obj, path) {
		var value = obj;
		var scope, key;
		var validPath = path.split('.').every(function (prop) {
			scope = value;
			key = prop;
			if (null == scope) {
				// break
				return false;
			} else {
				value = scope[key];
				return true;
			}
		});
		//return validPath && { value: value, scope: scope, key: key };
		return value;
	},
	getNodeByXPath: function (doc, xpath) {
		var root = doc.root();

		var allNS = {};

		root.namespaces().forEach(function(ns, index) {
			if (ns.prefix())
				allNS[ns.prefix()] = ns.href();
		})

		// console.log (allNS);

		var node = doc.get (xpath, allNS);

		return node;
	}

}
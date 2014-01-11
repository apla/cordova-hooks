#!/bin/env node

var libxml  = require ('libxmljs');
var fs      = require ('fs');
var path    = require ('path');
var cordova = require ('cordova');

var cordova_util  = require('cordova/src/util');
var projectRoot   = cordova_util.isCordova(process.cwd());
var projectXml    = cordova_util.projectConfig(projectRoot);
var projectConfig = new cordova_util.config_parser(projectXml);

var orientation = "default";

projectConfig.preference.get().some (function (preference) {
	if (preference.name == "orientation") {
		orientation = preference.value;
		return true;
	}
});

console.log ("orientation is: " + orientation);

var config = {
	android: {
		fileName: "AndroidManifest.xml",
		xpath: "/manifest/application/activity[@android:label='@string/app_name']",
		values: {
			"": "unspecified",
			default: "unspecified",
			portrait: "portrait",
			landscape: "landscape",
		},
		processor: function (node, orientation, config) {
			var attr = node.attr ({
				// "http://schemas.android.com/apk/res/android",
				"android:screenOrientation":
				config.values[orientation]
			});
		}
	},
	wp8: {
		fileName: "MainPage.xaml",
		xpath: "/phone:PhoneApplicationPage",
		values: {
			"": ["None", "PortraitOrLandscape"],
			default: ["None", "PortraitOrLandscape"],
			portrait: ["Portrait", "Portrait"],
			landscape: ["Landscape", "Landscape"],
		},
		processor: function (node, orientation, config) {
			var attr = node.attr ({
				// "http://schemas.android.com/apk/res/android",
				Orientation: config.values[orientation][0],
				SupportedOrientations: config.values[orientation][1]
			});
		}
	}
};

var platform = "android";
var configFileName = path.resolve ("platforms", platform, config[platform].fileName);

console.log ("setting "+platform+" orientation");

if (config[platform].xpath) {
	var doc = parseXML (configFileName);
	var node = getNodeByXPath (doc, config[platform].xpath);

	config[platform].processor (node, orientation, config[platform]);

	fs.writeFileSync (configFileName, doc.toString(false));
}

var platform = "wp8";
var configFileName = path.resolve ("platforms", platform, config[platform].fileName);

console.log ("setting "+platform+" orientation");

if (config[platform].xpath) {
	var doc = parseXML (configFileName);
	var node = getNodeByXPath (doc, config[platform].xpath);

	config[platform].processor (node, orientation, config[platform]);

	fs.writeFileSync (configFileName, doc.toString(false));
}


function parseXML (configFileName) {
	var configContents = fs.readFileSync (configFileName);

	var doc = libxml.parseXmlString (configContents);
	return doc;
}

function getNodeByXPath (doc, xpath) {
	var root = doc.root();

	var allNS = {};

	root.namespaces().forEach(function(ns, index) {
		allNS[ns.prefix()] = ns.href();
	})

	console.log (allNS);

	var node = doc.get (xpath, allNS);

	return node;
}

#!/bin/env node

var libxml  = require ('libxmljs');
var plist   = require('plist');
var fs      = require ('fs');
var path    = require ('path');
var cordova = require ('cordova');

var hookLib = require (path.join (__dirname, '..', 'me.apla.cordova-hooks.js'));

var orientation = hookLib.getPreference ("orientation") || "default";

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
				Orientation: config.values[orientation][0],
				SupportedOrientations: config.values[orientation][1]
			});
		}
	},
	ios: {
		fileName: "{$projectName}/{$projectName}-Info.plist",
		values: {
			"": ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown", "UIInterfaceOrientationLandscapeRight", "UIInterfaceOrientationLandscapeLeft"],
			default: ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown", "UIInterfaceOrientationLandscapeRight", "UIInterfaceOrientationLandscapeLeft"],
			"portrait-handset": ["UIInterfaceOrientationPortrait"],
			portrait: ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown"],
			landscape: ["UIInterfaceOrientationLandscapeRight", "UIInterfaceOrientationLandscapeLeft"],
		},
		processor: function (doc, orientation, config) {
			var targetDevice = hookLib.getPreference ("target-device");
			if ((targetDevice != "tablet" || targetDevice != "handset") && orientation != "default") {
				console.warn ("If you targeting both tablet and handset, then you probably need to set different device orientations for every target type");
			}
			var orientations = this.values[orientation + '-' + targetDevice] || this.values[orientation];

			doc["UISupportedInterfaceOrientations"] = orientations;
			doc["UISupportedInterfaceOrientations~ipad"] = orientations;
		}
	}
};

var projectConfig = hookLib.getCordovaConfig();
var dict = {
	projectName: projectConfig.name(),
	projectId: projectConfig.packageName(),
	version: projectConfig.version()
};

var platformNames = fs.readdirSync("platforms");
platformNames.forEach (function (platformName) {
	if (!(platformName in config))
		return;

	var platformConf = config[platformName];

	var dictRe = new RegExp ("{\\$([^}]+)}", 'g');
	var fileName = platformConf.fileName.replace (dictRe, function (match, p1) {
		return dict[p1];
	});

	console.log ("setting "+platformName+" orientation via " + fileName);

	var configFileName = path.resolve ("platforms", platformName, fileName);

	if (platformConf.xpath) {
		var doc = hookLib.parseXML (configFileName);
		var node = hookLib.getNodeByXPath (doc, platformConf.xpath);

		platformConf.processor (node, orientation, platformConf);

		fs.writeFileSync (configFileName, doc.toString(false));
	} else if (platformName == "ios") {
		var doc = hookLib.parsePlist (configFileName);

		platformConf.processor (doc, orientation, platformConf);

		// console.log (doc);
		fs.writeFileSync (configFileName, plist.build(doc).toString());
	}

});


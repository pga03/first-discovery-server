/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/GPII/first-discovery-server/master/LICENSE.txt
*/

"use strict";

var kettle = require("kettle");
/*
kettle.config.loadConfig({
    configPath: "./src/config",
    configName: "bluemix"
});
*/
kettle.config.makeConfigLoader({
    configName: kettle.config.getNodeEnv("bluemix"),
    configPath: kettle.config.getConfigPath() || __dirname + "/src/configs"
});
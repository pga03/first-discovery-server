"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var compression = require("compression")();

fluid.registerNamespace("gpii.express.middleware.compression");

gpii.express.middleware.compression.middleware = function (that, req, res, next) {

    console.log(req.url);
    compression(req, res, next);
};

fluid.defaults("gpii.express.middleware.compression", {
    gradeNames: ["gpii.express.middleware"],

    invokers: {
        "middleware": {
            "funcName": "gpii.express.middleware.compression.middleware",
            "args": ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

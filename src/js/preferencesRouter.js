/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

"use strict";

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var $ = fluid.registerNamespace("jQuery");

require("kettle");
require("gpii-express");

/***********
 * Handler *
 ***********/

fluid.defaults("gpii.firstDiscovery.server.preferences.handler", {
    gradeNames: ["gpii.express.handler"],
    config: {},
    components: {
        accessTokenDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: "{handler}.options.config.securityServer.hostname",
                port: "{handler}.options.config.securityServer.port",
                path: "{handler}.options.config.securityServer.paths.token",
                writable: true,
                writeMethod: "POST",
                components: {
                    encoding: {
                        type: "kettle.dataSource.encoding.formenc"
                    }
                },
                setResponseTransforms: [] // Do not parse the "set" response as formenc - it is in fact JSON
            }
        },
        preferencesDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: "{handler}.options.config.securityServer.hostname",
                port: "{handler}.options.config.securityServer.port",
                path: "{handler}.options.config.securityServer.paths.preferences",
                writable: true,
                writeMethod: "POST",
                termMap: {
                    view: "%view"
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.firstDiscovery.server.preferences.handler.storePrefs",
            args:     ["{that}"]
        },
        errorHandler: {
            funcName: "gpii.firstDiscovery.server.preferences.handler.errorHandler",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        successHandler: {
            func: "{that}.sendResponse",
            args: [200, "{arguments}.0"]
        },
        getAccessToken: {
            funcName: "gpii.firstDiscovery.server.preferences.handler.getAccessToken",
            args: ["{that}"]
        },
        createUser: {
            funcName: "gpii.firstDiscovery.server.preferences.handler.createUser",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    },
    prefContext: {
        "contexts": {
            "gpii-default": {
                "name": "Default preferences",
                "preferences": {}
            }
        }
    }
});

/**
 * Handles error responses
 *
 * @param that {Object} - the component
 * @param error {Object} - the error information to return. If a statusCode property
 *                         is included it will be used for the response code.
 *                         Otherwise 500 will be used as the response code.
 */
gpii.firstDiscovery.server.preferences.handler.errorHandler = function (that, error, errorMsg) {
    fluid.log("gpii.firstDiscovery.server.preferences.handler.errorHandler: entering ");
    fluid.log("gpii.firstDiscovery.server.preferences.handler.errorHandler: error: " + JSON.stringify(error, null, 2));

    var errorObj = $.extend(true, {}, error, {
        statusCode: error.statusCode || 500,
        message: errorMsg + ": " + error.message,
        isError: true
    });

    fluid.log(fluid.logLevel.WARN, errorObj);
    that.sendResponse(errorObj);
};

/**
 * Retrieves the access token from the security accessTokenDataSource
 *
 * @param that {Object} - the component
 *
 * @returns {promise} - returns a fluid.promise. On resolve it will return an
 *                      access object {access_token: "", token_type: ""}. On
 *                      reject an error object will be returned.
 */
gpii.firstDiscovery.server.preferences.handler.getAccessToken = function (that) {
    fluid.log("gpii.firstDiscovery.server.preferences.handler.getAccessToken: entering");
    fluid.log("gpii.firstDiscovery.server.preferences.handler.getAccessToken: that.accessTokenDataSource: " + JSON.stringify(that.accessTokenDataSource), null, 2);
    fluid.log("gpii.firstDiscovery.server.preferences.handler.getAccessToken: that.options.config.authentication: " + JSON.stringify(that.options.config.authentication, null, 2));

    var promise = fluid.promise();
    fluid.log("gpii.firstDiscovery.server.preferences.handler.getAccessToken: calling set on data source");
    var atPromise = that.accessTokenDataSource.set(null, that.options.config.authentication);

    atPromise.then(function (response) {
        fluid.log("gpii.firstDiscovery.server.preferences.handler.getAccessToken: atPromise resolved with response: " + JSON.stringify(response), null, 2);
        var access = JSON.parse(response);
        promise.resolve(access);
    }, promise.reject);

    return promise;
};

/**
 * Creates a new user in the preferencesDataSource.
 *
 * @param that {Object} - the component
 * @param access {Object} - an access object of the form {access_token: "", token_type: ""}
 * @param prefs {Object} - the preferences to store
 * @param view {String} - the name of the view/ontology that the preferences should be stored in.
 *
 * @returns {promise} - returns a fluid.promise. On resolve it will return an
 *                      user object {userToken: "", preferences: {}}. On
 *                      reject an error object will be returned.
 */
gpii.firstDiscovery.server.preferences.handler.createUser = function (that, access, prefs, view) {
    fluid.log("gpii.firstDiscovery.server.preferences.handler.createUser: entering");
    fluid.log("gpii.firstDiscovery.server.preferences.handler.createUser: access: " + JSON.stringify(access, null, 2));
    fluid.log("gpii.firstDiscovery.server.preferences.handler.createUser: prefs: " + JSON.stringify(prefs, null, 2));
    fluid.log("gpii.firstDiscovery.server.preferences.handler.createUser: view: " + view);

    var toStore = fluid.copy(that.options.prefContext);
    fluid.set(toStore, ["contexts", "gpii-default", "preferences"], prefs);

    return that.preferencesDataSource.set({
        view: view
    }, toStore, {
        headers: {
            Authorization: access.token_type + " " + access.access_token
        }
    });
};

/**
 * Handles requests to store preferences. This requires a workflow that involves
 * retrieving an access token, which is used to create a new user with the preferences
 * sent in the request's body.
 *
 * @param that {Object} - the component
 */
gpii.firstDiscovery.server.preferences.handler.storePrefs = function (that) {
    var view = that.request.query.view || "";
    var body = that.request.body || {};

    var accessTokenPromise = that.getAccessToken();

    accessTokenPromise.then(function (access) {
        var storePromise = that.createUser(access, body, view);
        storePromise.then(that.successHandler, function (error) {
            that.errorHandler(error, "Failed to store Preferences");
        });
    }, function (error) {
        that.errorHandler(error, "Failed to retrieve access token");
    });
};


/**********
 * Router *
 **********/

fluid.defaults("gpii.firstDiscovery.server.preferences.router", {
    gradeNames: ["gpii.express.contentAware.router"],
    method: "post",
    handlers: {
        json: {
            contentType:  "application/json",
            handlerGrades: ["gpii.firstDiscovery.server.preferences.handler"]
        }
    }
});

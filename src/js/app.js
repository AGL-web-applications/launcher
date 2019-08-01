/*
 * Copyright 2019 Igalia, S.L.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Mustache from 'mustache';
var configjson = require('../config.json');

var host = document.location.hostname;
var port = document.location.port;
var args = new URLSearchParams(document.location.search.substring(1));
var token = args.get("x-afb-token") || args.get("token") || "HELLO";
var afb;
var template;

function log(smgs) {
    document.getElementById('log').innerHTML += '<div>'+smgs+'</div>';
}

function show_app(app) {
    document.getElementById("app-"+app.id).style["display"]="block";
}

function display_icon(app) {
    return new Promise(function(resolve, reject) {
        var iconInactiveURL = '/images/icons/'+app.name.toLowerCase()+'_inactive.svg';
        var iconActiveURL = '/images/icons/'+app.name.toLowerCase()+'_active.svg';
        var image = new Image();

        image.onload = function() {
            document.getElementById("icon-inactive-"+app.id).src = iconInactiveURL;
            document.getElementById("icon-enabled-"+app.id).src = iconActiveURL;
            resolve();
        }

        image.onerror = function(){
            resolve();
        }

        image.src = iconInactiveURL;

    });
}


function render_applications(apps) {
    var appContainer = document.getElementById('AppContainer');
    for( var i=0; i<apps.length; i++) {
        if( configjson.black_list.indexOf(apps[i].id) === -1 ) {
            appContainer.innerHTML += Mustache.render(template, apps[i]);
            (function(app) {
                display_icon(app).then(function() {
                    show_app(app);
                });
            })(apps[i]);
        }
    }
}

function load_application_list() {
    var ws = new afb.ws(function() {
        var api_verb = "afm-main/runnables";
        ws.call(api_verb, {}).then(
            function(obj) {
                render_applications(obj.response);
            },
            function(obj) {
                //TODO Manage errors
                log("failure");
            }
        );
    },
    function() {
        //TODO manage errors
        log("ws aborted");
    });
}

export function display(app) {
    var appId = app.getAttribute('app-id');
    var ws = new afb.ws(function() {
        var api_verb = "homescreen/showWindow";
        var split_id = appId.split('@');
        var request = {application_id: split_id[0], parameter: {area: "normal.full"}};
        ws.call(api_verb, request).then(
            function(obj) {
                log("success: " + obj.response);
            },
            function(obj) {
                //TODO Manage errors
                log("failure on display");
            }
        );
    },
    function() {
        //TODO Manage errors
        log("ws aborted");
    });
}

export function launch(app) {
    var appId = app.getAttribute('app-id');
    var ws = new afb.ws(function() {
        var api_verb = "afm-main/start";
        var request = {id: appId};
        ws.call(api_verb, request).then(
            function(obj) {
                log("success: " + obj.response);
                display(app);
            },
            function(obj) {
                //TODO Manage errors
                log("failure on launch");
            }
        );
    },
    function() {
        //TODO Manage errors
        log("ws aborted");
    });
}

export function init() {
    template = document.getElementById('item-template').innerHTML;
    Mustache.parse(template);

    // host: "raspberrypi3.local:31022",
    afb = new AFB({
        host: host+":"+port,
        token: token
    });
    load_application_list();
}
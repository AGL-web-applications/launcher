import Mustache from 'mustache';

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
        appContainer.innerHTML += Mustache.render(template, apps[i]);
        (function(app) {
            display_icon(app).then(function() {
                show_app(app);
            });
        })(apps[i]);
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

export function launch(app) {
    var appId = app.getAttribute('app-id');
    var ws = new afb.ws(function() {
        var api_verb = "afm-main/start";
        var request = {id: appId};
        ws.call(api_verb, request).then(
            function(obj) {
                log("success: " + obj.response);
            },
            function(obj) {
                //TODO Manage errors
                log("failure");
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
        host: "raspberrypi3.local:31022",
        // host: host+":"+port,
        token: token
    });
    load_application_list();
}
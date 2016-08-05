
window.nurx = (function() {

    var DEFAULT_SERVICE_PORT = 14151;
    var SIDEBAR_WIDTH = 300;
    var LOG_HEIGHT = 200;

    var pokedata = window.pokedata;

    var commandListeners = { };

    var ws;   
    var pokestopInterval;
    
    // Obserbables.
    var selectedPane = ko.observable("navigation");
    var statsData = ko.observable(null);
    var profileData = ko.observable(null);

    // Functions.

    /**
     * Initalize the frontend.
     */
    function init() { 
        // Connect to NecroBot.
        connectSocketServer();
    }


    /**
     * Setup the websockets connection.
     */
    function connectSocketServer() {
        var support = "MozWebSocket" in window ? 'MozWebSocket' : ("WebSocket" in window ? 'WebSocket' : null);

        if (support == null) {
            alert("Your browser cannot doesn't websockets. :(");
            return;
        }

        ws = new window[support]('ws://localhost:' + DEFAULT_SERVICE_PORT + '/');        
        ws.onmessage = handleMessage;

        // when the connection is established, this method is called
        ws.onopen = function () { 
            console.log( "Server connection opened." ); 
            
            // Initial data retrieval.
            sendCommand("location", {});
            sendCommand("profile", {});
            sendCommand("pokemonlist", {});
            sendCommand("pokestops", {});

            pokestopInterval = setInterval(function() {
                sendCommand("pokestop", {}); 
            }, 1000 * 60 * 5);
        }

        // when the connection is closed, this method is called
        ws.onclose = function () { console.log( "Server connection closed."); }
    }


    /**
     * Send a websockets command.
     */
    function sendCommand(command, data) {
        var cmd = {
            'Command': command,
            'Data': data 
        };
        ws.send(JSON.stringify(cmd));        
    }


    /**
     * Websockets callback for handling messages. 
     */
    function handleMessage(evt) {
        var message = JSON.parse(evt.data);
        
        // Pass the message off to any registered command listeners.
        if(message.MessageType in commandListeners) {
            commandListeners[message.MessageType](message);
            return;
        }

        // Default commands.
        switch(message.MessageType) {
            case "profile":
                profileData(message.Data);
                break;
            case "stats":
                statsData(message.Data);
                break;
            default:
                console.log("Unknown command: ", message);
                break;
        }            
    }


    /**
     * Handle window resizing.
     */
    function resizeWindow() {
        var w = $(window).width();
        var h = $(window).height();

        $(".sidebar").css({
            'position': 'fixed',
            'height': '100%',
            'width': SIDEBAR_WIDTH + 'px',
            'left': '0px',
            'top': '0px'
        });

        $(".pane-container").css({
            'position': 'fixed',
            'height': (h - LOG_HEIGHT) + "px",
            'width': (w - SIDEBAR_WIDTH) + 'px',
            'left': SIDEBAR_WIDTH + 'px',
            'top': '0px'
        });

        $('.log').css({
            'position': 'fixed',
            'height': LOG_HEIGHT + "px",
            'width': (w - SIDEBAR_WIDTH) + 'px',
            'left': SIDEBAR_WIDTH + 'px',
            'bottom': '0px'            
        })
    }

    // Setup window events, initialize window.
    $(window).resize(resizeWindow);
    $(document).ready(function() {
        resizeWindow();
        ko.applyBindings(vm);
    })

    var vm = {    
        pokedata: pokedata,
        commandListeners: commandListeners,

        // Obserbables.
        selectedPane: selectedPane,
        statsData: statsData,
        profileData: profileData,
     
        // Functions.
        init: init,
        sendCommand: sendCommand
    };   
    return vm;
})();
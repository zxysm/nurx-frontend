
window.nurx = (function() {

    var DEFAULT_SERVICE_PORT = 14151;
    var SIDEBAR_WIDTH = 300;
    var LOG_HEIGHT = 200;

    var pokedata = window.pokedata;

    var defaultModalOptions = {
        ready: function() { $('#global').addClass('modal-active'); },
        complete: function() { $('#global').removeClass('modal-active'); }
    };

    var panels = {};

    // Observables.
    var instances = ko.observableArray([]);
    var selectedInstanceIdx = ko.observable(-1);

    var newInstUrl = ko.observable();
    var newInstUser = ko.observable();
    var newInstPass = ko.observable();
    
    // Functions.

    /**
     * Register panel to Nurx.
     */
    function registerPanel(panelName, panelFactory) {
        panels[panelName] = panelFactory;
    }

    /**
     * Create instance.
     */
    function createInstance(wsUrl, wsUser, wsPass) {
        var instanceId = Math.floor((Math.random() * 100000));
        var commandListeners = {};
        var instancePanels = {}

        var ws;   
        var pokestopInterval;

        // Obserbables.
        var selectedPane = ko.observable("navigation");
        var statsData = ko.observable(null);
        var profileData = ko.observable(null);
        var isConnected = ko.observable(false);
        var connectionText = ko.observable();

        /**
         * Initalize the frontend.
         */
        function init() { 
            // Connect to NecroBot.
            connectionText("Connecting...");
            connectSocketServer();

            // Initalize all panels.
            for (var key in instancePanels) {
                if (instancePanels.hasOwnProperty(key))
                    instancePanels[key].init();
            }
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

            ws = new window[support]('ws://' + wsUrl + '/');        
            ws.onmessage = handleMessage;

            // when the connection is established, this method is called
            ws.onopen = function () { 
                console.log( "Server connection opened." );
                isConnected(true);
                
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
            ws.onclose = function () { 
                isConnected(false);
                console.log( "Server connection closed."); 

                connectionText("Connection lost, reconnecting...");
            }
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
            console.log(message);

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

        // Create the instance viewmodel.
        var nurxInstance = {
            // Credentials.
            credentials: {
                wsUrl: wsUrl,
                wsUser: wsUser,
                wsPass: wsPass
            },

            commandListeners: commandListeners,
            instancePanels: instancePanels,
            instanceId: instanceId,

            // Obserbables.
            selectedPane: selectedPane,
            statsData: statsData,
            profileData: profileData,
            isConnected: isConnected,
            connectionText: connectionText,
        
            // Functions.
            init: init,
            sendCommand: sendCommand
        }

        // For each panel we have, initialize it and inject it into the instance.
        for (var key in panels) {
            if (panels.hasOwnProperty(key)) {
                nurxInstance[key] = panels[key](nurxInstance);
                nurxInstance.instancePanels[key] = nurxInstance[key];
            }
        }

        // Add the instance to the root viewmodel.
        instances.push(nurxInstance);
        nurxInstance.init();
    }
    
    /**
     * Handle window resizing.
     */
    function resizeWindow() {
        var w = $(window).innerWidth();
        var h = $(window).innerHeight();

        console.log("Resizing...");

        $(".sidebar").css({
            'height': (h - 40) + "px",
            'width': SIDEBAR_WIDTH + 'px'
        });

        $(".pane-container").css({
            'height': (h - LOG_HEIGHT - 40) + "px",
            'width': (w - SIDEBAR_WIDTH) + 'px'                       
        });
        $(".pane").css({
            'height': (h - LOG_HEIGHT - 40) + "px",
            'width': (w - SIDEBAR_WIDTH) + 'px'                       
        });        

        $('.log').css({
            'height': LOG_HEIGHT + "px",
            'width': (w - SIDEBAR_WIDTH) + 'px'          
        });
    }


    /**
     * Show the dialog for adding a new instance.
     */
    function showNewInstanceDialog() {
        $('#instance-create-modal').openModal(defaultModalOptions);

        newInstUrl("localhost:" + DEFAULT_SERVICE_PORT);
        newInstUser("admin");
        newInstPass("");
        Materialize.updateTextFields();
    }

    /**
     * Create the new instance tab.
     */
    function createNewInstanceTab() {
        createInstance(newInstUrl(), newInstUser(), newInstPass());

        selectedInstanceIdx(instances().length - 1);
        closeNewInstanceModal();
        resizeWindow();        
    }

    /**
     * Close the new instance modal.
     */
    function closeNewInstanceModal() {
        $('#instance-create-modal').closeModal(defaultModalOptions);
    }

    // Setup window events, initialize window.
    $(window).resize(resizeWindow);
    $(document).ready(function() {       
        ko.applyBindings(vm);
        resizeWindow();

        $('.modal-trigger').leanModal(); 
    })

    var vm = {    
        pokedata: pokedata,

        instances: instances,
        selectedInstanceIdx: selectedInstanceIdx,
        newInstUrl: newInstUrl,
        newInstUser: newInstUser,
        newInstPass: newInstPass,        

        registerPanel: registerPanel,
        createInstance: createInstance,
        resizeWindow: resizeWindow,
        showNewInstanceDialog: showNewInstanceDialog,
        createNewInstanceTab: createNewInstanceTab,
        closeNewInstanceModal: closeNewInstanceModal
    };   
    return vm;
})();
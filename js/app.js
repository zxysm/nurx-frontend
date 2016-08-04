window.vm = (function() {

    var LOCATION_HISTORY_MAX_POINTS = 200;
    var SIDEBAR_WIDTH = 300;
    var LOG_HEIGHT = 200;

    var pokedata = window.pokedata;

    var logLevels = {
        0: 'None',
        1: 'Error',
        2: 'Warning',
        3: 'Pokestop',
        4: 'Farming',
        5: 'Recycling',
        6: 'Berry',
        7: 'Caught',
        8: 'Transfer',
        9: 'Evolve',
        10: 'Egg',
        11: 'Update',
        12: 'Info',
        13: 'Debug'
    };
    var maxLogLevel = 12;

    var ws;
    var map;
    var playerMarker;
    var fortMarkers = [];
    var pokestopInterval;

    var mapStyle = [{"stylers":[{"hue":"#ff1a00"},{"invert_lightness":true},{"saturation":-100},{"lightness":33},{"gamma":0.5}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#2D333C"}]}];

    var locationHistory = [];
    var locationLine;

    // Obserbables.
    var selectedPane = ko.observable("navigation");
    var pokemonListData = ko.observableArray([]);
    var statsData = ko.observable(null);
    var profileData = ko.observable(null);

    // Computeds.
    var pokemonListSorted = ko.computed(function() {
        var clonedData = JSON.parse(JSON.stringify(pokemonListData()));
        var pokemonSortField = "Perfection";

        clonedData.sort(function(a, b) {
            if(pokemonSortField == "Perfection") {
                if(a.Perfection == b.Perfection)
                    return 0;
                else
                    return a.Perfection > b.Perfection ? -1 : 1;
            }
        
            if(a.Base[pokemonSortField] == a.Base[pokemonSortField])
                return 0;
            else
                return a.Base[pokemonSortField] > a.Base[pokemonSortField] ? -1 : 1;
        });

        return clonedData;
    });

    // Functions.

    /**
     * Initalize the frontend.
     */
    function init() {

        // Initialize the map.
        var myOptions = {
            zoom:16,
            center: new google.maps.LatLng(51.5073509,-0.12775829999998223),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: mapStyle
        };
        map = new google.maps.Map(document.getElementById('gmap_canvas'), myOptions);

        playerMarker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(51.5073509,-0.12775829999998223),
            icon: "img/marker_50.png",
            zIndex: 200
        });  

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

        ws = new window[support]('ws://localhost:2012/');        
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
        //console.log(message);

        switch(message.MessageType) {
            case "update_location":
                 updateLocation(message);
                 break;
            case "log_message":
                logMessage(message);
                break;
            case "pokestops":
                loadPokestops(message);
                break;
            case "pokemonlist":
                pokemonListData(message.Data);
                break;
            case "profile":
                profileData(message.Data);
                break;
            case "stats":
                statsData(message.Data);
                break;
            default:
                console.log(message);
                break;
        }            
    }

    /**
     * Handle location updates.
     */
    function updateLocation(message) {

        // Set the center and player marker.
        var pos = new google.maps.LatLng(message.Data.Lat, message.Data.Lng);
        map.setCenter(pos);
        playerMarker.setPosition(pos);

        // Setup the location history line.
        locationHistory.push({ lat: message.Data.Lat, lng: message.Data.Lng });
        while(locationHistory.length > LOCATION_HISTORY_MAX_POINTS) {
            locationHistory.splice(0, 1);
        }

        if(locationLine != null)
            locationLine.setMap(null);

        locationLine = new google.maps.Polyline({
            path: locationHistory,
            geodesic: true,
            strokeColor: '#5691FF',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        locationLine.setMap(map);
    }


    /**
     * Handle logging.
     */
    function logMessage(message) {  
        // Don't log stuff over the max log level.
        if(message.Data.Level > maxLogLevel)
            return;
            
        // Add new log entry, truncate old entries.
        $("#log-content").append("<div class='log-entry log-color-" + message.Data.Level + "'>[" + logLevels[message.Data.Level] + "] " + message.Data.Message + '</div>');
        $("#log-content").css({ height: ($("#log").height() - 20) + "px" });

        while($(".log-entry").length > 100) {
            $('#log-content').find('.log-entry:lt(1)').remove();
        }

        // Auto scroll to bottom.
        var height = $("#log-content")[0].scrollHeight;
        $("#log-content").scrollTop(height);
    }


    /**
     * Handle loading of pokestops.
     */
    function loadPokestops(message) {
        console.log(message);

        ko.utils.arrayForEach(fortMarkers, function(item) {
            item.setMap(null);
        });
        fortMarkers = [];

        ko.utils.arrayForEach(message.Data, function(fortData) {
            var fortMarker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(fortData.Latitude, fortData.Longitude),
                icon: "img/pokestop_25.png",
                zIndex: 100
            });
            fortMarkers.push(fortMarker);
        });
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

        // Obserbables.
        selectedPane: selectedPane,
        pokemonListData: pokemonListData,
        statsData: statsData,
        profileData: profileData,
     
        // Computeds.
        pokemonListSorted: pokemonListSorted,

        // Functions.
        init: init,
        sendCommand: sendCommand
    };
   
    return vm;
})();

window.nurx.registerPanel("log", function(nurx) {
    var maxLogLevel = 12;
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

    /**
     * Handle logging.
     */
    function logMessage(message) {  
        // Don't log stuff over the max log level.
        if(message.Data.Level > maxLogLevel)
            return;
            
        // Add new log entry, truncate old entries.
        $("#" + nurx.instanceId + " .log-content").append("<div class='log-entry log-color-" + message.Data.Level + "'>[" + logLevels[message.Data.Level] + "] " + message.Data.Message + '</div>');
        $("#" + nurx.instanceId + " .log-content").css({ height: ($("#" + nurx.instanceId + " .log").height() - 20) + "px" });

        while($("#" + nurx.instanceId + " .log-entry").length > 100) {
            $("#" + nurx.instanceId + " .log-content").find('.log-entry:lt(1)').remove();
        }

        // Auto scroll to bottom.
        var height = $("#" + nurx.instanceId + " .log-content")[0].scrollHeight;
        $("#" + nurx.instanceId + " .log-content").scrollTop(height);
    }

    // Setup websockets command listners.
    nurx.commandListeners["log_message"] = logMessage;

    return {
        init: function() {}
    };
});

window.nurx.registerPanel("pokemon", function(nurx) {

    // Observables.
    var pokemonListData = ko.observableArray([]);
    
    // Computeds.
    var pokemonListSorted = ko.computed(function() {
        var clonedData = JSON.parse(JSON.stringify(pokemonListData()));
        var pokemonSortField = "Perfection";

        // Strip out all null pokemon entries since they're messing stuff up.
        var containsNullPoke = true;
        while(containsNullPoke) {
            containsNullPoke = false;
            for(var i = 0; i < clonedData.length; i++) {
                if(clonedData[i] == null) {
                    clonedData.splice(i, 1);
                    containsNullPoke = true;
                    break;
                }
            }
        }

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

        console.log(clonedData);
        return clonedData;
    });

    // Functions.
    function loadPokemonList(message) {
        pokemonListData(message.Data); 
    }

    // Setup websockets command listners.
    nurx.commandListeners["pokemonlist"] = loadPokemonList;

    return {
        // Observables.
        pokemonListData: pokemonListData,

        // Computeds.
        pokemonListSorted: pokemonListSorted,

        // Functions.
        init: function() {}
    };
});
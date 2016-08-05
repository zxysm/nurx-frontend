
window.nurx.pokemon = (function() {

    // Observables.
    var pokemonListData = ko.observableArray([]);
    
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
    function loadPokemonList(message) {
        pokemonListData(message.Data);
    }

    // Setup websockets command listners.
    window.nurx.commandListeners["pokemonlist"] = loadPokemonList;

    return {
        // Observables.
        pokemonListData: pokemonListData,

        // Computeds.
        pokemonListSorted: pokemonListSorted
    };
})();
var getToonIndex = function (name) {
    var idx = -1;
    var i = 0;
    while (i < save.toons.length) {
        if (save.toons[i].name == name) {
            idx = i;
            return idx;
        }
        i++;
    }
    return idx;
}

var getSquadIndex = function (squadId, squads) {
    var idx = -1;
    var i = 0;
    while (i < squads.length) {
        // console.log(squads[i].id);
        if (squads[i].id == squadId) {
            idx = i;
            return idx;
        }
        i++;
    }
    return idx;
}

// Convenience function
var createSquadTable = function(id) {
    var t = document.createElement('table');
    t.id = id;
    t.className = 'squad';
    
    var tb = document.createElement('tbody');
    tb.className = 'connectedSortable';
    
    var tr = document.createElement('tr');
    var thName = document.createElement('th');
    var thPower = document.createElement('th');
    thName.append(document.createTextNode(id));
    thPower.append(document.createTextNode(0));
    tr.appendChild(thName);
    tr.appendChild(thPower);
    tb.appendChild(tr);
    t.appendChild(tb);
    
    return t;
}

var refreshDivs = function () {
    // Delete all squads and toons
    $(".squad").remove();
    
    // Create container for toons not yet assigned to a squad
    $("div#toons").append(createSquadTable('unassigned'));
    
    // Generate squad tables dynamically based on number of toons
    var newSquadCount = Math.ceil(save.toons.length/5);
    // console.log(newSquadCount);
    for (var i = 1; i <= newSquadCount; i++) {
        var iTable = createSquadTable('Squad ' + i);
        $("div#container").append(iTable);
    }
    
    // Use save data to add toons to squad tables
    for (var i = 0; i < save.toons.length-1; i++) {
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        var tdPower = document.createElement('td');
        tdName.append(document.createTextNode(save.toons[i].name));
        tdPower.append(document.createTextNode(save.toons[i].power));
        tr.appendChild(tdName);
        tr.appendChild(tdPower);
      
        var squads = $('.squad');
        var targetSquad = squads[getSquadIndex(save.toons[i].squadId, squads)];
        var targetPower = parseInt(targetSquad.children[0].children[0].children[1].innerHTML)
        targetSquad.children[0].appendChild(tr);
        targetSquad.children[0].children[0].children[1].innerHTML = (targetPower + parseInt(save.toons[i].power));
    }
    
    // Define drag'n'drop behavior for table rows
    $("tbody.connectedSortable")
        .sortable({
        connectWith: ".connectedSortable",
        items: "> tr:not(:first)",
        appendTo: "parent",
        helper: "clone",
        cursor: "move",
        zIndex: 999990,
        receive: function (event, item) {
            // Get the values we'll need
            var name = item.item[0].children[0].innerHTML;
            var power = parseInt(item.item[0].children[1].innerHTML);
            var squadId = item.item[0].offsetParent.id;
            var prevSquadId = save.toons[getToonIndex(name)].squadId;

            // Find the before and after squad tables
            var squads = $('.squad');
            var targetSquad = squads[getSquadIndex(squadId, squads)];
            var targetPower = parseInt(targetSquad.children[0].children[0].children[1].innerHTML);
            var prevSquad = squads[getSquadIndex(prevSquadId, squads)];
            var prevPower = parseInt(prevSquad.children[0].children[0].children[1].innerHTML);
            
            // Calculate new squad table power totals
            targetSquad.children[0].children[0].children[1].innerHTML = (targetPower + power);
            prevSquad.children[0].children[0].children[1].innerHTML = (prevPower - power);
            
            // Assign new squadId in save data for toon belonging to selected row
            save.toons[getToonIndex(name)].squadId = squadId;
            
            // console.log(name + ' --> ' + squadId);
        }
    });
};

document.getElementById("getToonsBtn").addEventListener('click', () => {
    function getDocumentHTML() {
        return document.body.innerHTML;
    }

    // Build save data by scraping swgoh.gg collection
    chrome.tabs.executeScript({
        code: '(' + getDocumentHTML + ')();' //argument here is a string but function.toString() returns function's code
    }, (results) => {
        var doc = results[0];
        
        powerArray = $(doc).find('div.collection-char-gp');
        console.log(powerArray);
        
        for (var i = 0; i < powerArray.length; i++) {
            var toon = {"squadId": "unassigned"};
            var parts = powerArray[i].dataset.originalTitle.split(' / ')[0].split(' ');
            var power = parts[1].replace(',','');
            if (power < 6000) {
                break;
            }
            var name = $(doc).find('a.collection-char-name-link')[i].innerText;
            toon.name = name;
            toon.power = power;
            if (getToonIndex(name) < 0) {
                save.toons.push(toon);
            }
        }
        refreshDivs();
    });
});

// Preserve save data in chrome storage API
document.getElementById("saveBtn").addEventListener('click', () => {
    chrome.storage.sync.set({"save": save}, function() {});
});

// Load save data from chrome storage API
document.getElementById("loadBtn").addEventListener('click', () => {
    chrome.storage.sync.get(["save"], function(items) {
        save = items.save;
        refreshDivs();
    });
});

// Delete all squads and toons
document.getElementById("clearBtn").addEventListener('click', () => {
    $('.squad').remove();
    save.toons = [];
});

// Define save data variable
var save = {
    "toons": []  // Contains information about each toon
};

// Boilerplate logic for remembering checkbox value and loading automatically
var autoLoadCB = document.getElementById("autoLoadCB");
autoLoadCB.addEventListener('click', () => {
    chrome.storage.sync.set({"autoLoad": autoLoadCB.checked}, function(){});
});
chrome.storage.sync.get({"autoLoad":false}, function(items) {
    $("#autoLoadCB").prop("checked", items.autoLoad);
    if (autoLoadCB.checked) {
        document.getElementById("loadBtn").click();
    }
});
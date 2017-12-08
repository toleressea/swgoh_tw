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
        console.log(squads[i].id);
        if (squads[i].id == squadId) {
            idx = i;
            return idx;
        }
        i++;
    }
    return idx;
}

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
    $(".squad").remove();
    
    $("div#toons").append(createSquadTable('unassigned'));
    
    var newSquadCount = Math.ceil(save.toons.length/5);
    console.log(newSquadCount);
    for (var i = 0; i < newSquadCount; i++) {
        var iTable = createSquadTable('Squad ' + i);
        $("div#container").append(iTable);
    }
    
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
        targetSquad.children[0].appendChild(tr);
    }
    
    $("tbody.connectedSortable")
        .sortable({
        connectWith: ".connectedSortable",
        items: "> tr:not(:first)",
        appendTo: "parent",
        helper: "clone",
        cursor: "move",
        zIndex: 999990,
        receive: function (event, item) {
            var name = item.item[0].children[0].innerHTML;
            var squadId = item.item[0].offsetParent.id;
            console.log(name + ' --> ' + squadId);
            save.toons[getToonIndex(name)].squadId = squadId;
        }
    });
};

document.getElementById("getToonsBtn").addEventListener('click', () => {
    function getDocumentHTML() {
        return document.body.innerHTML;
    }

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

document.getElementById("saveBtn").addEventListener('click', () => {
    chrome.storage.sync.set({"save": save}, function() {});
});

document.getElementById("loadBtn").addEventListener('click', () => {
    chrome.storage.sync.get(["save"], function(items) {
        save = items.save;
        refreshDivs();
    });
});

var save = {
    "toons": []
};

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
$(document).ready(function () {
    $("tbody.connectedSortable")
        .sortable({
        connectWith: ".connectedSortable",
        items: "> tr:not(:first)",
        appendTo: "parent",
        helper: "clone",
        cursor: "move",
        // zIndex: 999990,
        receive: function (e1, e2) {
            console.log(e1);
            console.log(e2.item);
        }
    });
});
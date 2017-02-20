
var Table = function (tableId, options, values) {

    // Define the row item.
    var item = '<tr id="table-item">';
    for (var column of options.columns) {
        item += '<td class="' + column + '"></td>';
    }
    item += '</tr>';
    options.item = item;

    List.apply(this, arguments)

    // Click event.
    domTable = document.getElementById(tableId);
    domTable.addEventListener("click", function (e) {
        var element = e.srcElement || e.target;
        if (element == null) return;
        if (element.nodeName == 'TABLE') return;
        while (element.nodeName != 'TR') element = element.parentNode;
        var id = parseInt(element.children[0].textContent);

        var evt = e ? e:window.event;

        // Control pressed.
        if (evt.ctrlKey || evt.metaKey) {
            console.log("control");
        }
        // Shift pressed.
        else if (evt.shiftKey) {
            console.log("shift");
        }

        console.log(id);
    });
}

Table.prototype = List.prototype;
Table.prototype.constructor = Table;


Table.prototype.emit = function (name, data) {
    var event = new CustomEvent(name, {"detail": data});
    document.dispatchEvent(event);
}


Table.prototype.onEvent = function (name, callback) {
    document.addEventListener(name, function (e) {
        callback(e.detail);
    }, false);
}


// ----------------------------------------------------------------------------
// TEST
// ----------------------------------------------------------------------------

var data = [
    {"id": 0, "n_spikes": 10, "group": "unsorted", "quality": 1.},
    {"id": 1, "n_spikes": 20, "group": "unsorted", "quality": 0.9},
    {"id": 2, "n_spikes": 30, "group": "good", "quality": 0.8},
    {"id": 3, "n_spikes": 40, "group": "noise", "quality": 0.7},
];


var options = {
  valueNames: ['id', 'n_spikes', 'quality'],
  columns: ["id", "n_spikes", "quality"],
};


var myTable = new Table('table', options, data);
// onEvent("add_to_selection", function(data) {console.log(data);});

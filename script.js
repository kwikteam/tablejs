
var Table = function (tableId, options, values) {

    // Define the row item.
    var item = '<tr id="table-item">';
    for (var column of options.columns) {
        item += '<td class="' + column + '"></td>';
    }
    item += '</tr>';
    options.item = item;

    this.el = document.getElementById(tableId).
        getElementsByTagName('table')[0];

    List.apply(this, arguments)
    this._selectedRows = [];
    this._setClick();
    this._setEventHandlers();
}

Table.prototype = List.prototype;
Table.prototype.constructor = Table;


function getId (element) {
    /* Return the id of an element of the table. */
    if (element == null) return;
    if (element.nodeName == 'TABLE') return;
    while (element.nodeName != 'TR') {
        element = element.parentNode;
    }
    return parseInt(element.children[0].textContent);
};


Table.prototype.getRow = function (id) {
    /* Return the TR element with a given id. */
    var tbody = this.el.getElementsByTagName('tbody')[0];
    for (var row of tbody.children) {
        if ((row.nodeName == 'TR') && (row.children[0].textContent == id)) {
            return row;
        }
    }
    return null;
};


Table.prototype._setClick = function () {
    var that = this;
    this.el.addEventListener("click", function (e) {
        var element = e.srcElement || e.target;
        var evt = e ? e:window.event;
        var id = getId(element);

        // Control pressed.
        if (evt.ctrlKey || evt.metaKey) {
            that.emit("select-toggle", id);
        }
        // Shift pressed.
        // else if (evt.shiftKey) {
        //     that.emit("select-until", id);
        // }
        // No control or shift.
        else {
            that.emit("select", id);
        }
    });
};


Table.prototype._clearSelection = function () {
    for (var prevSelected of this._selectedRows) {
        prevSelected.classList.remove("selected");
    }
    this._selectedRows = [];
}


Table.prototype._addToSelection = function (row) {
    if (!row) return;
    row.classList.add("selected");
    this._selectedRows.push(row);
}


Table.prototype._removeFromSelection = function (row) {
    if (!row) return;
    row.classList.remove("selected");
    var index = this._selectedRows.indexOf(row);
    if (index > -1) {
        this._selectedRows.splice(index, 1);
    }
}


Table.prototype._setEventHandlers = function () {
    var that = this;
    this.onEvent("select", function (id) {
        var row = that.getRow(id);
        that._clearSelection();
        that._addToSelection(row);
    });
    this.onEvent("select-toggle", function (id) {
        var row = that.getRow(id);
        if (that._selectedRows.includes(row)) {
            that._removeFromSelection(row);
        }
        else {
            that._addToSelection(row);
        }
    });
    this.onEvent("select-until", function (id) {
        if (that._selectedRows.length != 1) return;
        var first = that._selectedRows[0];
        var row = that.getRow(id);
        // TODO
    });
};


Table.prototype.emit = function (name, data) {
    var event = new CustomEvent(name, {"detail": data});
    document.dispatchEvent(event);
};


Table.prototype.onEvent = function (name, callback) {
    document.addEventListener(name, function (e) {
        callback(e.detail);
    }, false);
};


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
// console.log(myTable);

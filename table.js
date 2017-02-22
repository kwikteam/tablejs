
// Utility functions
// ----------------------------------------------------------------------------

function getId (element) {
    /* Return the id of an element of the table. */
    if (element == null) return;
    if (element.nodeName == 'TABLE') return;
    while (element.nodeName != 'TR') {
        element = element.parentNode;
    }
    return parseInt(element.children[0].textContent);
};


// Table
// ----------------------------------------------------------------------------

var Table = function (tableId, options, values) {
    this.el = document.getElementById(tableId).
        getElementsByTagName('table')[0];

    this.fel = document.getElementById(tableId).
        getElementsByTagName('input')[0];

    // Set the row item.
    options.item = this._setRowItem(options);

    // Set the header cells.
    this._setHeader(options);

    this._selectedRows = [];

    // Constructor.
    List.apply(this, arguments)

    // Set click event and event handlers.
    this._setClick();
    this._setKeyPress();
    this._setEventHandlers();
    this._updateDataAttributes();
}

Table.prototype = List.prototype;
Table.prototype.constructor = Table;


// Constructor
// ----------------------------------------------------------------------------

Table.prototype._setRowItem = function (options) {
    // Define the row item.
    var item = '<tr id="table-item">';
    for (var column of options.columns) {
        item += '<td class="' + column + '"></td>';
    }
    item += '</tr>';
    return item;
};


Table.prototype._setHeader = function (options) {
    var thead = this.el.getElementsByTagName("thead")[0];

    // Header.
    var tr = document.createElement("tr");
    for (var column of options.columns) {
        var th = document.createElement("th");
        th.appendChild(document.createTextNode(column));
        th.classList.add("sort");
        th.dataset.sort = column;
        tr.appendChild(th);
    }
    thead.appendChild(tr);
};


Table.prototype._getRow = function (id) {
    /* Return the TR element with a given id. */
    var tbody = this.el.getElementsByTagName('tbody')[0];
    for (var row of tbody.children) {
        if ((row.nodeName == 'TR') && (row.children[0].textContent == id)) {
            return row;
        }
    }
    return null;
};


Table.prototype._getHeader = function (column) {
    /* Return the TH element of a given column. */
    var thead = this.el.getElementsByTagName('thead')[0];
    for (var th of thead.children[0].children) {
        if ((th.nodeName == 'TH') && (th.textContent == column)) {
            return th;
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
        else if (evt.shiftKey) {
            that.emit("select-until", id);
        }
        // No control or shift.
        else {
            that.emit("select", id);
        }
    });
};


Table.prototype._setKeyPress = function () {
    var that = this;
    this.fel.addEventListener("input", function (e) {
        var text = that.fel.value;
        var textOrig = text;
        if (!text) {
            that.filter();
            return
        }
        // Replace column name in JS expression.
        for (name of that.valueNames) {
            text = text.replace(new RegExp("\\b" + name + "\\b", "g"),
                                "item.values()." + name);
        }
        // Filter according to the written expression.
        that.filter(function (item) {
            try {
                out = eval(text);
                return out;
            }
            catch (err) {
                return true;
            }
        });
    });
};


Table.prototype._currentSort = function() {
    // Return the current sort if there is one.
    for (let column of this.columns) {
        var th = this._getHeader(column);
        if (th.classList.contains("asc")) return [column, "asc"];
        else if (th.classList.contains("desc")) return [column, "desc"];
    }
};


Table.prototype._updateDataAttributes = function() {
    for (let item of this.items) {
        let values = item.values();
        if (values._meta) {
            let row = this._getRow(values.id);
            row.dataset.meta = values._meta;
        }
    }
}


// Selection
// ----------------------------------------------------------------------------

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


// Event system
// ----------------------------------------------------------------------------

Table.prototype._setEventHandlers = function () {
    var that = this;
    this.onEvent("select", function (id) {
        if (isNaN(id)) return;
        var row = that._getRow(id);
        that._clearSelection();
        that._addToSelection(row);
    });
    this.onEvent("select-toggle", function (id) {
        if (isNaN(id)) return;
        var row = that._getRow(id);
        if (that._selectedRows.includes(row)) {
            that._removeFromSelection(row);
        }
        else {
            that._addToSelection(row);
        }
    });
    this.onEvent("select-until", function (id) {
        if (isNaN(id)) return;
        if (that._selectedRows.length != 1) return;
        var first = that._selectedRows[0];
        var row = that._getRow(id);
        // TODO
    });
    this.on("sortComplete", function () {
        // React to sort.
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


// Public methods
// ----------------------------------------------------------------------------

Table.prototype.select_ = function(ids) {
    this._clearSelection();
    for (let id of ids) {
        this._addToSelection(this._getRow(id));
    }
};


Table.prototype.add_ = function(objects) {
    this.add(objects);
    this._updateDataAttributes();
    var sort = this._currentSort();
    if (!sort) return;
    this.sort(sort[0], {"order": sort[1]});
}


Table.prototype.change_ = function(objects) {
    for (let object of objects) {
        var item = this.get("id", object.id)[0];
        item.values(object);
    }
    this._updateDataAttributes();
    var sort = this._currentSort();
    if (!sort) return;
    this.sort(sort[0], {"order": sort[1]});
}


Table.prototype.remove_ = function(ids) {
    for (let id of ids) {
        this.remove("id", id);
    }
    this._updateDataAttributes();
}


Table.prototype.selected = function() {
    return this._selectedRows.map(function (row) { return getId(row); });
};


Table.prototype._isMasked = function(row) {
    if (!row) return false;
    return this.get("id", getId(row))[0].values()._meta == "mask";
};


Table.prototype.getSiblingId = function(id, dir="next") {
    // By default, first selected item.
    if (typeof(id) === "undefined") {
        id = this.selected()[0];
    }
    // Otherwise, first item in the list.
    if (id == null) return null;
    var row = this._getRow(id);
    do {
        if (dir == "next") row = row.nextSibling;
        else if (dir == "previous") row = row.previousSibling;
    }
    while (this._isMasked(row));
    if (this._isMasked(row)) return null;
    // Ensure the result is not masked.
    return getId(row);
};


Table.prototype.moveToSibling = function(id, dir="next") {
    // Select the first item if there is no selection.
    if (this._selectedRows.length == 0) {
        this.emit("select", this.items[0].values().id);
        return;
    }
    var newId = this.getSiblingId(id, dir);
    if (newId == null) return;
    this.emit("select", newId);
};


// Test
// ----------------------------------------------------------------------------

var data = [
    {"id": 0, "n_spikes": 10, "group": "unsorted", "quality": 1.},
    {"id": 1, "n_spikes": 20, "group": "unsorted", "quality": 0.9},
    {"id": 2, "n_spikes": 30, "group": "good", "quality": 0.8,
     "_meta": "highlight"},
    {"id": 3, "n_spikes": 40, "group": "noise", "quality": 0.7,
     "_meta": "mask"},
];


var options = {
  valueNames: ["id", "n_spikes", "quality", "group", "_meta"],
  columns: ["id", "n_spikes", "quality", "group"],
};


var myTable = new Table('table', options, data);
// console.log(myTable);

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


Table.prototype._getIds = function () {
    /* Return all ids in order. */
    var tbody = this.el.getElementsByTagName('tbody')[0];
    var ids = [];
    for (var row of tbody.children) {
        if (row.nodeName == 'TR') {
            ids.push(parseInt(row.children[0].textContent));
        }
    }
    return ids;
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
            that.selectToggle(id);
        }
        // Shift pressed.
        else if (evt.shiftKey) {
            that.selectUntil(id);
        }
        // No control or shift.
        else {
            that.select([id]);
        }
    });
};


Table.prototype.filter_ = function (text) {
    var textOrig = text;
    if (!text) {
        this.filter();
        return
    }
    // Replace column name in JS expression.
    for (name of this.valueNames) {
        text = text.replace(new RegExp("\\b" + name + "\\b", "g"),
                            "item.values()." + name);
    }
    // Filter according to the written expression.
    this.filter(function (item) {
        try {
            out = eval(text);
            return out;
        }
        catch (err) {
            return true;
        }
    });
};


Table.prototype._setKeyPress = function () {
    var that = this;
    this.fel.addEventListener("input", function (e) {
        var text = that.fel.value;
        that.filter_(text);
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
    this.on("sortComplete", function () {
        // TODO: react to sort.
    });
};


Table.prototype.selectToggle = function (id) {
    if (isNaN(id)) return;
    var row = this._getRow(id);
    if (this._selectedRows.includes(row)) {
        this._removeFromSelection(row);
    }
    else {
        this._addToSelection(row);
    }
     this._emitSelected();
};


Table.prototype.selectUntil = function (id) {
    if (isNaN(id)) return;
    if (this._selectedRows.length != 1) return;
    var first = this._selectedRows[0];
    var row = this._getRow(id);
    this._emitSelected();
};


Table.prototype.emit = function (name, data) {
    console.debug("Emit from JS table: " + name + " " + data);
    var event = new CustomEvent("phy_event", {detail: {name: name, data: data}});
    document.dispatchEvent(event);
};


Table.prototype.onEvent = function (name, callback) {
    document.addEventListener("phy_event", function (e) {
        if (e.detail.name == name) {
            callback(e.detail.data);
        }
    }, false);
};


// Public methods
// ----------------------------------------------------------------------------

Table.prototype.select = function(ids) {
    this._clearSelection();
    for (let id of ids) {
        this._addToSelection(this._getRow(id));
    }
    this._emitSelected();
};


Table.prototype._emitSelected = function () {
     this.emit("select", this.selected());
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
        this.select([this.items[0].values().id]);
        return;
    }
    var newId = this.getSiblingId(id, dir);
    if (newId == null) return;
    this.select([newId]);
};


Table.prototype.sort_ = function(name, sort_dir="asc") {
    this.sort(name, {"order": sort_dir});
}

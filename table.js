
// Utility functions
// ----------------------------------------------------------------------------

function getId (element) {
    /* Return the id of an element of the table. */
    if (element == null) return null;
    if (element.nodeName == 'TABLE') return null;
    while (element != null && element.nodeName != 'TR') {
        element = element.parentNode;
    }
    if (element != null && element.parentNode != null && element.parentNode.nodeName == 'TBODY') {
        return parseInt(element.children[0].textContent);
    }
    else {
        return null;
    }
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


Table.prototype._iterRows = function* () {
    var tbody = this.el.getElementsByTagName('tbody')[0];
    for (var row of tbody.children) {
        if (row == null) continue;
        if (row.nodeName == 'TR') {
            yield row;
        }
    }
};


Table.prototype._getRow = function (id) {
    /* Return the TR element with a given id. */
    for (var row of this._iterRows()) {
        if (row.children[0].textContent == id) {
            return row;
        }
    }
    return null;
};


Table.prototype._getIds = function () {
    /* Return all ids in order. */
    var ids = [];
    for (var row of this._iterRows()) {
        ids.push(parseInt(row.children[0].textContent));
    }
    return ids;
};


Table.prototype._getHeader = function (column) {
    /* Return the TH element of a given column. */
    var thead = this.el.getElementsByTagName('thead')[0];
    for (var th of thead.children[0].children) {
        if (th == null) continue;
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
        if (id == null) return;

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
    // Left-over, can get rid of.
    return;
}


// Selection
// ----------------------------------------------------------------------------

Table.prototype._clearSelection = function () {
    for (var row of this._iterRows()) {
        row.classList.remove("selected");
    }
}


Table.prototype._addToSelection = function (row) {
    if (!row) return;
    row.classList.add("selected");
}


Table.prototype._removeFromSelection = function (row) {
    if (!row) return;
    row.classList.remove("selected");
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
    row.classList.toggle("selected");
    this._emitSelected();
};


Table.prototype.selectUntil = function (id) {
    if (isNaN(id)) return;
    // TODO
    // this._emitSelected();
};


Table.prototype.emit = function (name, data) {
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


Table.prototype.selectFirst = function() {
    if (this.items.length > 0) {
        this.select([this.items[0].values().id]);
    }
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
};


Table.prototype.change_ = function(objects) {
    for (let object of objects) {
        var item = this.get("id", object.id)[0];
        if (item != null) {
            item.values(object);
        }
    }
    this._updateDataAttributes();
    var sort = this._currentSort();
    if (!sort) return;
    this.sort(sort[0], {"order": sort[1]});
};


Table.prototype.remove_ = function(ids) {
    for (let id of ids) {
        this.remove("id", id);
    }
    this._updateDataAttributes();
};


Table.prototype.removeAll = function() {
    this._clearSelection();
    this.remove_(this._getIds());
};


Table.prototype.removeAllAndAdd = function(objects) {
    this.removeAll();
    this.add_(objects);
};


Table.prototype.selected = function() {
    var sel = [];
    for (let row of this._iterRows()) {
        if (row.classList.contains("selected")) {
            sel.push(getId(row));
        }
    }
    return sel;
};


Table.prototype._isMasked = function(row) {
    if (!row) return false;
    return this.get("id", getId(row))[0].values().is_masked == true;
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
    if (this.selected().length == 0) {
        this.selectFirst();
        return;
    }
    var newId = this.getSiblingId(id, dir);
    if (newId == null) {
        //this.selectFirst();
        return;
    }
    this.select([newId]);
};


Table.prototype.sort_ = function(name, sort_dir="asc") {
    this.sort(name, {"order": sort_dir});
}


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


function removeSelectedClasses (row) {
    // Remove CSS classes starting with selected-, and return whether
    // classes where removed or not.
    for (let cl of row.classList) {
        if (cl.startsWith("color-")) {
            row.classList.remove(cl);
        }
    }
    for (let cl of row.classList) {
        if (cl.startsWith("selected-")) {
            row.classList.remove(cl);
            return parseInt(cl.substring(9));
        }
    }
    return false;
};


// Table
// ----------------------------------------------------------------------------

var Table = function (tableId, options, values) {
    this.el = document.getElementById(tableId).
        getElementsByTagName('table')[0];

    this.fel = document.getElementById(tableId).
        getElementsByTagName('input')[0];

    this._selectedIndexOffset = 0;

    // Add _id duplicate so that it can be used as TR data-id.
    for (let val of values) {
        val._id = val.id;
    }
    options.valueNames.unshift({data: ["_id"]});

    // Set the row item.
    options.item = this._setRowItem(options);

    // Set the header cells.
    this._setHeader(options);

    // Constructor.
    List.apply(this, arguments)

    this._nSelected = 0;

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
    for (let row of this._iterRows()) {
        if (getId(row) == id) return row;
    }
    //return document.querySelector("tr[data-_id='" + id + "']");
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

Table.prototype._setSelectedIndexOffset = function (n) {
    this._selectedIndexOffset = n;
}


Table.prototype._clearSelection = function () {
    for (var row of this._iterRows()) {
        this._removeFromSelection(row);
    }
    this._nSelected = 0;
}


Table.prototype._addToSelection = function (row) {
    if (!row) return;
    // If the row is already selected, do nothing.
    if (row.classList.contains("selected")) {
        return;
    }
    row.classList.add("selected", "selected-" + this._nSelected);
    row.classList.add("color-" + (this._nSelected + this._selectedIndexOffset));
    this._nSelected += 1;
}


Table.prototype._removeFromSelection = function (row) {
    if (!row) return;
    if (row.classList.contains("selected")) {
        row.classList.remove("selected");
        removeSelectedClasses(row);
        this._nSelected -= 1;
        this._renumberSelection();
    }
}


Table.prototype._renumberSelection = function () {
    var ids = this.selected();
    this._nSelected = 0;
    for (let id of ids) {
        var row = this._getRow(id);
        removeSelectedClasses(row);
        row.classList.add("selected-" + this._nSelected);
        row.classList.add("color-" + (this._nSelected + this._selectedIndexOffset));
        this._nSelected += 1;
    }
}


Table.prototype._toggleSelection = function (row) {
    if (!row) return;
    var wasSelected = row.classList.contains("selected");
    if (wasSelected) {
        this._removeFromSelection(row);
    }
    else {
        this._addToSelection(row);
    }
}


// Event system
// ----------------------------------------------------------------------------

Table.prototype._setEventHandlers = function () {
    var that = this;
    this.on("sortComplete", function () {

    });
};


Table.prototype.selectToggle = function (id) {
    if (isNaN(id)) return;
    this._toggleSelection(this._getRow(id));
    this._emitSelected();
};


Table.prototype._selectedRowIndices = function () {
    var rows = []
    for (let row of this._iterRows()) {
        if (row.classList.contains("selected")) {
            rows.push(row.rowIndex);
        }
    }
    return rows;
};


Table.prototype.selectUntil = function (id) {
    if (isNaN(id)) return;
    var clickedIndex = this._getRow(id).rowIndex - 1;
    //var selected = this.selected();
    //var lastSelected = selected[selected.length - 1];
    var lastIndex = Math.max.apply(Math, this._selectedRowIndices()) - 1;
    var imin = Math.min(clickedIndex, lastIndex);
    var imax = Math.max(clickedIndex, lastIndex);
    i = 0;
    for (let row of this._iterRows()) {
        if (i >= imin) this._addToSelection(row);
        if (i >= imax) break;
        i++;
    }
    this._emitSelected();
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
    return this._emitSelected();
};


Table.prototype.selectFirst = function() {
    if (this.items.length > 0) {
        var first = this.items[0].values().id;
        var row = this._getRow(first);
        if (this._isMasked(row)) {
            first = this.getSiblingId(first);
        }
        this.select([first]);
    }
};


Table.prototype._elementIsVisible = function (el) {
    var rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
};


Table.prototype._emitSelected = function () {
    var san = this.getSelectedAndNext();
    this.emit("select", san);
    console.log("select", san[0]);
    var row = this._getRow(san[0][0]);
    if (!this._elementIsVisible(row)) {
        window.scroll(0, row.offsetTop - window.innerHeight / 2.0);
    }
    return san;
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
    /* Return all ids in order. */
    var ids = {};
    var out = [];
    // for (let row of document.querySelectorAll("tr.selected")) {
    for (let row of this._iterRows()) {
        if (!row.classList.contains("selected")) continue;
        var id = getId(row);
        var pos = 0;
        for (let cl of row.classList) {
            if (cl.startsWith("selected-")) {
                pos = Math.max(pos, parseInt(cl.substring(9)));
            }
        }
        ids[pos] = id;
    }
    // WARNING: need to sort ids numerically, not lexicographically.
    for (let i of Object.keys(ids).sort((a, b) => a - b)) {
        out.push(ids[i]);
    }
    return out;
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


Table.prototype.getSelectedAndNext = function () {
    var selected = this.selected();
    if (selected.length > 0) {
        var next = this.getSiblingId(selected[selected.length - 1]);
    }
    else {
        var next = null;
    }
    return [selected, next];
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
    return this.select([newId]);
};


Table.prototype.sort_ = function(name, sort_dir="asc") {
    this.sort(name, {"order": sort_dir});
}


var Table = function (tableId, options, values) {
    this.el = document.getElementById(tableId).
        getElementsByTagName('table')[0];

    // Set the row item.
    options.item = this._setRowItem(options);

    // Set the header cells.
    this._setHeader(options);

    this._selectedRows = [];
    this._sortBy = {};

    // Set click event and event handlers.
    this._setClick();
    this._setEventHandlers();

    // Constructor.
    List.apply(this, arguments)
}

Table.prototype = List.prototype;
Table.prototype.constructor = Table;


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
        th.classList.add("sort-header");
        tr.appendChild(th);
    }
    thead.appendChild(tr);
};


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

        // Header.
        if (isNaN(id)) {
            // Unsorted -> sort asc -> sort desc.
            that.emit("sort-toggle", element.textContent);
        }

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


Table.prototype._clearSort = function () {
    // Remove sort class from all TH headers.
    var thead = this.el.getElementsByTagName('thead')[0];
    for (var th of thead.children[0].children) {
        if (th.nodeName == 'TH') {
            th.classList.remove("sort-up");
            th.classList.remove("sort-down");
        }
    }
    this._sortBy = {};
};


Table.prototype._setSort = function (column, order) {
    var th = this._getHeader(column);
    // Remove sort classes.
    th.classList.remove("sort-up");
    th.classList.remove("sort-down");
    // Add sort classes.
    th.classList.add("sort-" + order);
    this._sortBy.name = column;
    this._sortBy.order = order;
};


Table.prototype._toggleSort = function (column) {
    var order = this._sortBy.order;
    this._clearSort();
    if (order == "down") {
        // Nothing to do: sort is cleared.
    }
    else if (order == "up") {
        this._setSort(column, "down");
    }
    else  {
        this._setSort(column, "up");
    }
    console.log("Sort by", this._sortBy.name, this._sortBy.order);
};


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
    this.onEvent("sort-toggle", function (column) {
        that._toggleSort(column);
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

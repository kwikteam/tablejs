var data = [
    {"id": 0, "n_spikes": 10, "group": "unsorted", "quality": 1.},
    {"id": 1, "n_spikes": 20, "group": "unsorted", "quality": 0.9},
    {"id": 2, "n_spikes": 30, "group": "good", "quality": 0.8},
    {"id": 3, "n_spikes": 40, "group": "noise", "quality": 0.7},
];

var columns = ["id", "n_spikes", "quality"];

var item = '<tr id="table-item">';
for (var column of columns) {
    item += '<td class="' + column + '"></td>';
}
item += '</tr>';

var options = {
  valueNames: ['id', 'n_spikes', 'quality'],
  item: item,
};

var myTable = new List('table', options, data);

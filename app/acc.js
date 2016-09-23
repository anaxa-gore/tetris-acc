/**
 * Created by tbonavia on 21/09/2016.
 */
function CorpsDeMetier(nom, availables, used) {
    this._nom = nom;
    this._availables = availables;
    this._used = used;

    this.matrix = [];
}

CorpsDeMetier.prototype.getNom = function () {
    return this._nom;
};

var data = [new CorpsDeMetier('ELEC', [2, 2, 2, 2, 2], [1, 0, 3, 1, 5]), new CorpsDeMetier('PLOMB', [1, 1, 5, 5, 10], [1, 0, 3, 1, 35]), new CorpsDeMetier('PLOMB', [5, 5, 3, 3, 1], [3, 7, 3, 2, 10])];
// var data = [new CorpsDeMetier('MECA', [8, 6, 4, 3, 2, 1, 5, 5], [5, 3, 2, 4, 12, 1, 8, 2])];
// var data = [new CorpsDeMetier('ELEC', [5], [18])];


function computeData(data) {
    data.map(function (corps) {
        var maxDispo = d3.max(corps._availables);
        var maxDispoPlusOffset = maxDispo + 2;
        var corpsMatrix = [];

        corps._availables.map(function (currentDispo, i) {
            var residuel = currentDispo - corps._used[i]; // Nb not used during the period
            var column = new Array(maxDispoPlusOffset);
            column.fill('NONE');

            for (var t = 0; t < maxDispoPlusOffset; t++) {
                if (t < residuel)
                    column[t] = 'AVAILABLE'; // Si on a de la disponibilité en plus
                else if (t < (residuel + corps._used[i])) {
                    column[t] = 'USED'; // Si on a des ressources utilisées
                } else if (residuel < 0) {
                    column[t] = t != (maxDispoPlusOffset - 1) ? 'OVER' : 'SUPER_OVER';
                    residuel++;
                }
            }
            column.reverse();
            corpsMatrix.push(column);
        });
        corps.matrix = corpsMatrix;
    });
}

computeData(data);

/////////////////////////////////////////////////////////////////////////////////////////// RENDERING

function getColumnWidth(windowWidth, corpsDeMetier) {
    return windowWidth / corpsDeMetier.matrix.length;
}

function getResourceHeight(columnNode, nbResources){
    return d3.select(columnNode).attr('height') / nbResources;
}

function resize() {
    var accDiv = document.getElementById("acc");

    // Update the scale range depending on the window height
    heightScale.range([0, accDiv.clientHeight]);

    var svgs = d3.selectAll('svg').data(data);

    svgs.exit().remove();           // Delete data if does not exists anymore

    svgs.enter().append('svg')
        .attr('width', '100%')
        .style('background-color', function (d, i) {
            return i % 2 ? 'grey' : 'white';
        })
        .merge(svgs)                // Merging the two selections to update height for every bands
        .attr('height', function (d) {
            return heightScale(d3.max(d._availables) + 2);
        })
        .each(function (corpsDeMetier, svgIndex, svgs) {
            var columns = d3.select(this).selectAll('.column').data(corpsDeMetier.matrix);
            columns.enter().append('g')
                .attr('class', 'column')
                .merge(columns)
                .attr('width', function (columnData, columnIndex, columns) {
                    return getColumnWidth(this.parentNode.clientWidth, corpsDeMetier);
                })
                .attr('height', function (columnData, columnIndex, columns) {
                    return this.parentNode.clientHeight;
                })
                .attr('transform', function (columnData, columnIndex) {
                    return 'translate(' + columnIndex * getColumnWidth(this.parentNode.clientWidth, corpsDeMetier) + ')';
                })
                .each(function (columnData, columnIndex) {
                    var resources = d3.select(this).selectAll('.resource').data(columnData);
                    resources.enter()
                        .append('rect')
                        .attr('class', 'resource')
                        .attr('x', 0)
                        .merge(resources)
                        .attr('y', function(resourceData, resourceIndex){
                            return resourceIndex * getResourceHeight(this.parentNode, columnData.length);
                        })
                        .attr('width', function(resourceData, resourceIndex){
                            return d3.select(this.parentNode).attr('width');
                        })
                        .attr('height', function(resourceData, resourceIndex){
                            return getResourceHeight(this.parentNode, columnData.length);
                        })
                        .style('fill', function (el) {
                            switch (el) {
                                case 'AVAILABLE':
                                    return 'green';
                                case 'USED':
                                    return 'orange';
                                case 'OVER':
                                    return 'red';
                                case 'SUPER_OVER':
                                    return 'black';
                                case 'NONE':
                                default:
                                    return 'white';
                            }
                        })
                        .style('stroke', 'black');
                });
        });

    svgs.exit().remove();
}

window.addEventListener('resize', resize);
resize();


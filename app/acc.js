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


function generateArray(min, max, nb) {
    var start = new Date();

    var result = new Array(nb);
    for (var i = 0; i < nb; i++) {
        result[i] = Math.floor((Math.random() * max) + min);
    }

    var end = new Date();
    var duration = end.getTime() - start.getTime();
    // console.log('GenerateArray', duration+'ms');
    return result;
}

var SIZE = 90;

var c1 = new CorpsDeMetier('MECA', generateArray(0, 15, SIZE), generateArray(0, 5, SIZE));
var c2 = new CorpsDeMetier('MECA', generateArray(0, 8, SIZE), generateArray(0, 20, SIZE));
var c3 = new CorpsDeMetier('MECA', generateArray(0, 13, SIZE), generateArray(0, 25, SIZE));
var c4 = new CorpsDeMetier('MECA', generateArray(0, 3, SIZE), generateArray(0, 7, SIZE));
var c5 = new CorpsDeMetier('MECA', generateArray(0, 13, SIZE), generateArray(0, 25, SIZE));
var c6 = new CorpsDeMetier('MECA', generateArray(0, 3, SIZE), generateArray(0, 7, SIZE));


var data = [c1, c2];


setInterval(function () {
    c1._availables = generateArray(1, 15, SIZE);
    c2._availables = generateArray(0, 9, SIZE);
    c3._availables = generateArray(0, 13, SIZE);
    c4._availables = generateArray(0, 3, SIZE);
    c5._availables = generateArray(0, 13, SIZE);
    c6._availables = generateArray(0, 3, SIZE);

    c1._used = generateArray(0, 18, SIZE);
    c2._used = generateArray(0, 10, SIZE);
    c3._used = generateArray(0, 25, SIZE);
    c4._used = generateArray(0, 7, SIZE);
    c5._used = generateArray(0, 25, SIZE);
    c6._used = generateArray(0, 7, SIZE);

    computeData(data);
    updateData();
}, 300);

function computeData(data) {
    var start = new Date();

    data.map(function (corps) {
        var maxDispo = d3.max(corps._availables);
        var maxDispoPlusOffset = maxDispo + 2;
        var corpsMatrix = [];

        corps._availables.map(function (currentDispo, i) {
            var residuel = currentDispo - corps._used[i]; // Nb not used during the period
            var column = new Array(maxDispoPlusOffset);
            // column.fill('NONE');

            for (var t = 0; t < maxDispoPlusOffset; t++) {
                // TODO TBA : Inliner cette chose peut faire gagner 2 à 3 fois en perfs
                // var isOver = t != (maxDispoPlusOffset - 1);
                // column[t] = (t < residuel) ? 'AVAILABLE' : (t < (residuel + corps._used[i]) ? 'USED' : (residuel < 0 ? (isOver ? 'OVER' : 'SUPER_OVER') : ''));
                // if(residuel < 0)
                //     residuel++;
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

    var end = new Date();
    var duration = end.getTime() - start.getTime();
    console.log('ComputeData', duration+'ms');
}

computeData(data);


// ------------------------------------------------------------------- RENDERING
var margins = 2;

function calculateAvailableRessources(data) {
    var somme = 0;
    data.map(function (corps) {
        somme += d3.max(corps._availables) + 2;
    });

    return somme;
}

// Initialize the scale for each band
var heightScale = d3.scaleLinear().domain([0, calculateAvailableRessources(data)]);

function getResourceSize(svgSelection, nbResources, nbTimeSamples) {
    var height = Math.floor((svgSelection.attr('height') / nbResources) - (margins));
    var width = Math.floor((svgSelection.node().clientWidth / nbTimeSamples) - (margins));

    return width > height ? height : width;
}

function updateData() {
    d3.selectAll('svg').data(data)
        .each(function (corps, colIdx) {
            d3.select(this).selectAll('.column').data(corps.matrix)
                .each(function (colD, colIdx) {
                    d3.select(this).selectAll('.resource')
                        .data(colD)
                        .transition()
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
                })
        });
}

function resize() {
    var accDiv = document.getElementById("acc");

    // Update the scale range depending on the window height
    heightScale.range([0, accDiv.clientHeight]);

    var svgs = d3.selectAll('svg').data(data);

    svgs.exit().remove();           // Delete data if does not exists anymore

    svgs.enter().append('svg')
        .attr('width', '100%')
        .style('background', function (corpsDeMetier, i) {
            return i % 2 ? 'grey' : 'lightgrey';
        })
        .merge(svgs)                // Merging the two selections to update height for every bands
        .attr('height', function (corpsDeMetier) {
            return Math.floor(heightScale(d3.max(corpsDeMetier._availables) + 2));
        })
        .each(function (corpsDeMetier, svgIndex, svgs) {
            var svgSelection = d3.select(this);

            var columns = d3.select(this).selectAll('.column').data(corpsDeMetier.matrix);
            columns.enter().append('g')
                .attr('class', 'column')
                .merge(columns)
                .attr('transform', function (columnData, columnIndex) {
                    return 'translate(' + (columnIndex * getResourceSize(svgSelection, columnData.length, corpsDeMetier.matrix.length)) + ')';
                })
                .each(function (columnData, columnIndex) {
                    var resources = d3.select(this).selectAll('.resource').data(columnData);
                    resources.enter()
                        .append('rect')
                        .attr('class', 'resource')
                        .attr('x', margins + margins * columnIndex)
                        .merge(resources)
                        .attr('y', function (resourceData, resourceIndex) {
                            return resourceIndex * getResourceSize(svgSelection, columnData.length, corpsDeMetier.matrix.length) + margins + (margins * resourceIndex);
                        })
                        .attr('width', function (resourceData, resourceIndex) {
                            return getResourceSize(svgSelection, columnData.length, corpsDeMetier.matrix.length);
                        })
                        .attr('height', function (resourceData, resourceIndex) {
                            return getResourceSize(svgSelection, columnData.length, corpsDeMetier.matrix.length);
                        })
                        .transition()
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


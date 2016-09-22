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

// new CorpsDeMetier('ELEC', [2, 2, 2, 2, 2], [1, 0, 3, 1, 5]), new CorpsDeMetier('PLOMB', [1, 1, 5, 5], [1, 0, 3, 1]),
var data = [new CorpsDeMetier('MECA', [8, 6, 4, 3, 2, 1, 5, 5], [5, 3, 2, 4, 5, 1, 4, 2])]
// var data = [new CorpsDeMetier('ELEC', [5], [0])];


function computeData(data) {
    data.map(function (corps) {
        var realMaxResources = d3.max(corps._availables);
        var maxResources = realMaxResources + 2;
        var corpsMatrix = [];

        corps._availables.map(function (dispo, i) {
            var nbDispos = dispo - corps._used[i];
            var column = [];

            column[0] = nbDispos < -1 ? 'SUPER_OVER' : 'NONE';
            column[1] = nbDispos <= -1 ? 'OVER' : 'NONE';
            var nbUnused = realMaxResources - dispo;
            for (var u = 2; u < nbUnused; u++) {
                column[u] = 'NONE';
            }
            for (var u = 2 + nbUnused; u < maxResources; u++) {
                column[u] = (nbDispos <= 0 || ((maxResources - u) > nbDispos) ? 'USED' : 'AVAILABLE');
            }
            corpsMatrix.push(column);
        });

        corps.matrix = corpsMatrix;
    });
}

computeData(data);
console.log(data);

// var nbSquares = data.interval_hours * 60 / 15;
// var squareArray = d3.range(0, nbSquares, 1);

var colors = ['red', 'green', 'orange'];

function calculateAvailableRessources(data) {
    var somme = 0;
    data.map(function (corps) {
        somme += d3.max(corps._availables);
    });
    return somme;
}

// Initialize the scale for each band
var heightScale = d3.scaleLinear().domain([0, calculateAvailableRessources(data)]);

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
            return heightScale(d3.max(d._availables));
        });

    svgs.exit().remove();

    var columns = d3.selectAll('svg')
        .selectAll('.column').data(function (d) {
            // console.log("Matrice pour les colonnes : ", d.matrix);
            return d.matrix;
        });

    columns.exit().remove();
    columns.enter().append('g')
        .attr('class', 'column')
        .attr('fill', function (d, i) {
            return i % 2 ? 'grey' : 'white'
        })
        .attr('transform', function (d, i) {
            return 'translate(' + i * (this.parentNode.parentNode.clientWidth / d.length) + ')'; // FIXME TBA : this.parentNode.parentNode... à remplacer par le SVG correspondant
        }).attr('width', function (d) {
        return this.parentNode.parentNode.clientWidth / d.length; // FIXME TBA : this.parentNode.parentNode... à remplacer par le SVG correspondant
    })
    /*.append('rect')
     .attr('width', function (d) {
     return this.parentNode.parentNode.clientWidth / d.length; // FIXME TBA : this.parentNode.parentNode... à remplacer par le SVG correspondant
     })*/
        .attr('height', '100%')
        .each(function (column, i) {
            var users = d3.select(this).selectAll('.user').data(column);

            users.exit().remove();
            users.enter().append('rect')
                .attr('class', 'user')
                .attr('x', 0)
                .attr('y', function (d, i) {
                    return i * 50;
                })
                .attr('width', function () {
                    var width = d3.select(this.parentNode).attr('width');
                    return width;
                })
                .attr('height', 50)
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
                .style('stroke', 'black')
        });
    // .data(function (data, i) {
    //     console.log("Donnée par colonne : ", data.matrix[i]);
    //     return data;
    // });

    columns = columns.enter().merge(columns);


    // var squares = d3.selectAll('svg').selectAll('rect').data(function (d) {
    //     return d._availables;
    // });
    // squares.exit().remove();
    // squares.enter().append('g').attr('transform', function (d) {
    //     console.log(this.parentNode.clientHeight)
    //     return 'translate(0,' + (this.parentNode.clientHeight - 50  ) + ')';
    // })
    //     .append('rect')
    //     .merge(squares)
    //     .attr('width', function () {
    //         return 50;
    //         //         return horizontalSquareScale(1);
    //     })
    //     .attr('height', function (d, i, group) {
    //         return 50;
    //         //         console.log(this);
    //         //         return horizontalSquareScale(1);
    //     })
    //     .attr('x', function (d, i) {
    //         return 50 * i + (2 * i + 2);//horizontalSquareScale(1) * i + (2 * i + 2);
    //     }).transition()
    //     .style('fill', function () {
    //         return colors[Math.floor(Math.random() * colors.length)];
    //     })
    //     .style('stroke', 'rgb(0,0,0)')
    //     .style('stroke-width', 1);
    // console.log(colors[Math.floor(Math.random() * colors.length)]);
}

window.addEventListener('resize', resize);
resize();

d3.select('body').style('background-color', 'yellow');


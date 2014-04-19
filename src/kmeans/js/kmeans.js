"use strict";

function noiseIdentityFunction(centroid, x) {
    return x;
}

function kmeansGenerateDataset(numClusters, sizePerCluster, noise) {
    var points = [],
        centroids = [],
        _noise = noise || noiseIdentityFunction;

    while (numClusters--) {
        var centroid = [randFloat(-1, 1), randFloat(-1, 1)],
            rawPoints = generateRadialCluster(centroid, sizePerCluster),
            f = _.partial(_noise, centroid);
        points = points.concat(rawPoints.map(f));
        centroids.push(centroid);
    }

    return {
        points: points,
        centroids: centroids
    };
}

function generateRadialCluster(centroid, clusterSize, radius) {
    var _clusterSize = clusterSize || 100,
        _radius = radius || 0.2,
        clusterPoints = [],
        d = 0,
        alpha = 0;

    while (_clusterSize--) {
        d = randFloat(0, _radius);
        alpha = randFloat(0, 2 * Math.PI);
        clusterPoints.push([
            centroid[0] + d * Math.cos(alpha),
            centroid[1] + d * Math.sin(alpha)
        ])
    }

    return clusterPoints;
}

function randFloat(a, b) {
    var t = Math.random();
    return t * a + (1 - t) * b;
}

function KmeansDrawingContext(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.Ox = this.canvas.width / 2;
    this.Oy = this.canvas.height / 2;
    this.radius = 2;
}

function start() {

    $('input[type=button]').hide();
    $('#new-set').click(initData);

    var dataset = [],
        results = [],
        currentFrame=0;

    function noise(centroid, x) {
        var d = distance(centroid, x);

        if (d < 0.1) {
            return [
                x[0] + randFloat(0.1, 0.2),
                x[1] + randFloat(0.1, 0.2)
            ]
        }
        return x;
    }

    function initData() {
        dataset = kmeansGenerateDataset(4, 30, noise);
        dataset.points = dataset.points.filter(function(point) {
            return (-1 <= point[0]) && (point[0] <= 1)
                && (-1 <= point[1]) && (point[1] <= 1);
        });
        results = [];
        currentFrame = 0;

        var finalResult = kmeans(4, dataset.points, function(r) {
            results.push(_.cloneDeep(r));
        });

        if(results.length === 0) {
            results.push(finalResult);
        }

        redraw();
    }

    window.data = function () {
        var data = dataset;
        var sets = [];
        var result = results[currentFrame++ % results.length];

        var i = 0;
        _.each(result.clusters, function (cluster) {

            sets[i++] = {
                key: 'Cluster ' + i,
                values: (function () {
                    return _.map(cluster, function (point) {
                        if(!((-2 <= point[0]) && (point[0] <= 2)
                            && (-2 <= point[1]) && (point[1] <= 2))) {
                            console.log('nope! ', point);
                        }
                        return {
                            x: point[0],
                            y: point[1],
                            shape: 'circle'
                        };
                    });
                })()
            };
        });

        sets[i++] = {
            key: "Centroids",
            values: (function () {
                return _.map(result.centroids, function (point) {
                    return {
                        x: point[0],
                        y: point[1],
                        shape: 'cross',
                        size: 2
                    };
                });
            })()
        };

        return sets;
    };

    function redraw() {
        if(results.length > 1) {
            $('#iteration').text('iteration: ' + currentFrame % results.length);
        }

        nv.addGraph(function () {
            var chart = nv.models.scatterChart()
                .showDistX(true)
                .showDistY(true)
                .color(d3.scale.category10().range());

            chart.xAxis.tickFormat(d3.format('.02f'));
            chart.yAxis.tickFormat(d3.format('.02f'));

            d3.select('svg')
                .datum(data())
                //.transition().duration(1000)
                .call(chart);

            nv.utils.windowResize(chart.update);


            return chart;
        });
    }

    mocha.run(function(){
        scroolToFailOrDisplayDemo(function(){
            if ($('#mocha').css('display') === "none"){
                $('input[type=button]').show();
                initData();
                setInterval(function () {
                    redraw();
                }, 2000);
            }
        });
    });
}

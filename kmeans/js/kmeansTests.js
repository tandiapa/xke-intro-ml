'use strict';

mocha.setup('bdd');
mocha.reporter('html');
mocha.bail(true);
//mocha.checkLeaks();

chai.should();
var expect = chai.expect;
var assert = chai.assert;

describe('Kmeans', function () {
    function getParamsOf(func) {
        var funcStr = func.toString();
        var params = funcStr.match(/^function(?:.*?)\((.*)\)(?:.*?)\{/)[1];
        return params.replace(/ /g, '').split(',')
    }

    function nbParamsOf(func) {
        return func.length;
    }

    function arrayShouldContainAll(array /*expected item*/){
        var expectedItems = Array.prototype.slice.call(arguments,1);
        _.every(expectedItems,function(expectedItem){
            return !!_.find(array, function(item){
                return !(item<expectedItem || expectedItem<item); // Evil black magic !!
            });
        }).should.be.true;
    }

    function arrayShouldContainOneOfThem(array /*expected item*/){
        var expectedItems = Array.prototype.slice.call(arguments,1);
        _.some(expectedItems,function(expectedItem){
            return !!_.find(array, function(item){
                return !(item<expectedItem || expectedItem<item); // Evil black magic !!
            });
        }).should.be.true;
    }

    var sandbox;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("The distance function", function () {
        it('should exist', function () {
            expect(typeof distance).equal('function', 'The distance function doesn\'t exist');
        });
        it('should take two parameters', function () {
            nbParamsOf(distance).should.equal(2, 'The distance function doesn\'t contain two parameters');
        });
        it('should return 7.0710678118654755 when we pass [0,0] and [5,5]', function () {
            distance([0, 0], [5, 5]).should.equal(7.0710678118654755);
        });
        it('should return 2.23606797749979 when we pass [5,3] and [7,2]', function () {
            distance([5, 3], [7, 2]).should.equal(2.23606797749979);
        });
    });

    describe("The findClosestCentroidIndex function", function () {

        beforeEach(function () {
            sandbox.spy(window, "distance");
        });

        it('should exist', function () {
            expect(typeof findClosestCentroidIndex).equal('function', 'The findClosestCentroidIndex function doesn\'t exist');
        });
        it('should take two parameters', function () {
            nbParamsOf(findClosestCentroidIndex).should.equal(2, 'The findClosestCentroidIndex function doesn\'t contain two parameters');
        });
        it('should call distance for each centroid from origin "p"', function () {
            findClosestCentroidIndex([
                [1, 4],
                [3, 3],
                [5, 2]
            ], [2, 2]);
            distance.callCount.should.equal(3);
            distance.calledWith([1, 4], [2, 2]).should.true;
            distance.calledWith([3, 3], [2, 2]).should.true;
            distance.calledWith([5, 2], [2, 2]).should.true;
        });
        it('should return the index of the closest centroid', function () {
            findClosestCentroidIndex([
                [1, 4],
                [3, 3],
                [5, 2]
            ], [2, 2]).should.equal(1);
        });
    });

    describe('The partitionUsingTheDistance function', function () {

        beforeEach(function () {
            sandbox.spy(window, "findClosestCentroidIndex");
        });

        it('should exist', function () {
            expect(typeof partitionUsingTheDistance).equal('function', 'The partitionUsingTheDistance function doesn\'t exist');
        });
        it('should take two parameters, the first is the centroids, the second the points', function () {
            nbParamsOf(partitionUsingTheDistance).should.equal(2, 'The partitionUsingTheDistance function doesn\'t contain two parameters');
        });
        it('should return an object', function () {
            expect(partitionUsingTheDistance([], [])).to.be.an('object');
        });
        it('should group points by closest centroids index', function () {
            var centroids = [ [1, 1], [1, 4], [4, 4] ];
            var points = _.shuffle([
                [0,0],[1,0], // first partition
                [1,5],[0,4], // second partition
                [5,5],[4,5]  // third partition
            ]); // mix points

            var partitions = partitionUsingTheDistance(centroids, points);
            findClosestCentroidIndex.callCount.should.equal(6);
            arrayShouldContainAll(partitions[0], [0,0],[1,0]);
            arrayShouldContainAll(partitions[1], [1,5],[0,4]);
            arrayShouldContainAll(partitions[2], [5,5],[4,5]);
        });
    });

    describe ('The determineNewCentroid function', function(){
        it('should exist', function () {
            expect(typeof determineNewCentroid).equal('function', 'The determineNewCentroid function doesn\'t exist');
        });
        it('should take one parameter, an array of point', function () {
            nbParamsOf(determineNewCentroid).should.equal(1, 'The determineNewCentroid function doesn\'t contain one parameter');
        });
        it('should return a point', function () {
            expect(determineNewCentroid([[]]))
                .to.be.an("array")
                .and.all.be.an('array');// points
        });
        it('should return the point if its passed alone', function () {
            determineNewCentroid([[5,5]])
                .should.be.an('array')// a point
                .and.be.deep.equal([5,5]);
        });
        it('should return the barycenter of two points', function () {
            determineNewCentroid([[5,5], [0,0]])
                .should.be.an('array') // a point
                .and.deep.equal([2.5,2.5]);
        });
        it('should return the barycenter of three points', function () {
            determineNewCentroid([[4,4], [5,5], [0,0]])
                .should.be.an('array') // a point
                .and.be.deep.equal([3,3]);
        });
    });

    describe ('The updateCentroids function', function(){

        beforeEach(function () {
            sandbox.spy(window, "determineNewCentroid");
        });

        it('should exist', function () {
            expect(typeof updateCentroids).equal('function', 'The updateCentroids function doesn\'t exist');
        });
        it('should take one parameter, the parameter is an array of grouped points by index of centroids', function () {
            nbParamsOf(updateCentroids).should.equal(1, 'The determineNewCentroid function doesn\'t contain one parameter');
        });
        it('should return baryCenter of each group by calling determineNewCentroid function', function () {
            var groupOfPoint = {
                0: [[0,0],[1,0]], // first partition
                1: [[1,5],[0,4]], // second partition
                2: [[5,5],[4,5]]  // third partition
            };
            var baryCentersOfEachGroup = updateCentroids(groupOfPoint);
            determineNewCentroid.callCount.should.equal(3);
            arrayShouldContainAll(baryCentersOfEachGroup, [0.5,0], [0.5,4.5], [4.5,5]);
        });
    });

    describe ('The pickStartingCentroids function', function(){
        it('should exist', function () {
            expect(typeof pickStartingCentroids).equal('function', 'The pickStartingCentroids function doesn\'t exist');
        });
        it('should take two parameters. The first is number of group that we want to find and the second is an array of point', function () {
            nbParamsOf(pickStartingCentroids).should.equal(2, 'The determineNewCentroid function doesn\'t contain two parameters');
        });
        it('should return the first point when we want find one group and we have one point', function () {
            expect(pickStartingCentroids(1, [[4,4]]))
                .to.be.an('array')//
                .and.all.be.an('array')// points
                .and.be.deep.equal([[4,4]]);
        });
        it('should return the three points when we want find three groups and we have three points', function () {
            var points = pickStartingCentroids(3, [[1,1],[2,2],[4,4]]);
            arrayShouldContainAll(points, [1,1],[2,2],[4,4]);
        });
        it('should return random points of all passed points according to nb of partition we search', function () {
            var randomPoints1 = pickStartingCentroids(2, [[1,1],[2,2],[4,4],[5,5]]);
            var randomPoints2 = pickStartingCentroids(3, [[1,1],[2,2],[4,4],[5,5]]);

            randomPoints1.should.length(2);
            arrayShouldContainOneOfThem(randomPoints1, [1,1],[2,2],[4,4],[5,5]);

            randomPoints2.should.length(3);
            arrayShouldContainOneOfThem(randomPoints2, [1,1],[2,2],[4,4],[5,5]);
            //randomPoints2.should.not.be.deep.equal(randomPoints1); Not predictive but must mostly time true
        });
    });

    describe ('The kmeans function', function(){

        beforeEach(function () {
            sandbox.stub(window, "pickStartingCentroids");
            sandbox.spy(window, "updateCentroids");
        });

        afterEach(function (){
            pickStartingCentroids.restore && pickStartingCentroids.restore();
            partitionUsingTheDistance.restore && partitionUsingTheDistance.restore();
        });


        it('should exist', function () {
            expect(typeof kmeans).equal('function', 'The kmeans function doesn\'t exist');
        });
        it('should take two parameters. The first is the number of cluster we want find and the second are the points ', function () {
            nbParamsOf(kmeans).should.equal(2, 'The determineNewCentroid function doesn\'t contain two parameters');
        });
//        it('should call pickStartingCentroids one time to pick randomly points to start the centroid research', function () {
//            // prevent future calls
//            sandbox.stub(window, "partitionUsingTheDistance");
//            pickStartingCentroids.withArgs(2,[[1,1],[2,2],[3,3],[4,4]]).returns();
//
//            kmeans(2, [[1,1],[2,2],[3,3],[4,4]]);
//            pickStartingCentroids.callCount.should.be.equal(1);
//            pickStartingCentroids.calledWith(2, [[1,1],[2,2],[3,3],[4,4]]).should.true;
//        });
//        it('should call partitionUsingTheDistance and updateCentroidsFunc 1000 times. The first call of ' +
//            'partitionUsingTheDistance must be made with the result of pickStartingCentroids in first arg and the points' +
//            ' in second arg. The next calls of partitionUsingTheDistance will take the (potential) centroids returned by ' +
//            'updateCentroids. updateCentroids will take the previous result of partitionUsingTheDistance', function () {
//
//            var points = [ [1,1], [3,3], [8,8], [10,10] ], // points
//                nbClusters = 2, // number of cluster that we search
//                startingPoints = [points[0],points[2]]; // points that pickStartingCentroids should return
//
//            // mock functions to ensure a testable predictive behavior
//            pickStartingCentroids.withArgs(nbClusters, points).returns(startingPoints);
//            sandbox.spy(window, "partitionUsingTheDistance");
//
//            kmeans(nbClusters, points);
//
//            // check partitionUsingTheDistance function number of call and the args passed
//            partitionUsingTheDistance.callCount.should.be.least(1000);
//            expect(partitionUsingTheDistance.calledWith(startingPoints, points)).to.be.equal(true,
//                'partitionUsingTheDistanceis is called correctly the first time');
//            expect(partitionUsingTheDistance.calledWith([[2,2],[9,9]], points)).be.be.equal(true,
//                'partitionUsingTheDistance is called correctly the 999 next times');
//
//            // check partitionUsingTheDistance function number of call and the args passed
//            updateCentroids.callCount.should.be.equal(1000);
//        });
//       it('should return a object with a "centroids" property and a "partition" property who contain respectively an ' +
//           'array of centroids and the clusters of points (be careful: you should surly compute a last time ' +
//           'partitionUsingTheDistance to have the last clusters)', function () {

//           pickStartingCentroids.restore(); // necessary because of a SinonJS bug !
//           var points = [ [1,1], [3,3], [8,8], [10,10] ], // points
//               nbClusters = 2; // number of cluster that we search

//           var result = kmeans(nbClusters, points);
//           expect(result).to.be.an('object');

//           expect(result).to.have.property('centroids')
//               .that.is.an('array')// it's a list ?
//               .and.all.be.an('array');// it's points ?
//           arrayShouldContainAll(result.centroids, [2,2], [9,9]);


//           expect(result).to.have.property('clusters')
//               .that.is.an('object') // it's a map of cluster (key: index of a centroid, value : cluster)?
//               .and.have.keys("0", "1"); // contains only two clusters

//           var index2_2 = _.findIndex(result.centroids, function(centroid){
//               return centroid[0] === 2 && centroid[1] === 2;
//           });
//           var index9_9 = ~~!index2_2; // return 0 if 1, and 1 if 0

//           arrayShouldContainAll(result.clusters[index9_9], [8,8], [10,10]);
//           arrayShouldContainAll(result.clusters[index2_2], [1,1], [3,3]);
//       });
    });
});
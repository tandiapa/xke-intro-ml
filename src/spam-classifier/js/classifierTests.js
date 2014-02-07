'use strict';

mocha.setup('bdd');
mocha.reporter('html');
mocha.bail(true);
//mocha.checkLeaks();

chai.should();
var expect = chai.expect;
var assert = chai.assert;

describe('Naive Bayes spam classifier', function () {

    function nbParamsOf(func) {
        return func.length;
    }

    var sandbox;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
        sandbox = null;
    });


    describe("The SpamClassifier", function () {
        it('should exist', function () {
            expect(typeof window.SpamClassifier).equal('function', 'The spam classifier function should exist');
        });
        it('should be instantiable', function () {
            var classifier = new SpamClassifier();
            expect(classifier).to.be.instanceof(SpamClassifier, 'The spam classifier should be used in order to instantiate an object');
        });

        describe("train function", function () {

            var classifier;
            beforeEach(function(){
                classifier= new SpamClassifier();
                sandbox.spy(window, 'countKeys');
            });

            it('should have a train method', function () {
                expect(classifier.train).to.be.instanceof(Function, "Train should be a function");
            });
            it('should have one parameter', function () {
                nbParamsOf(classifier.train).should.equal(1, "The train method should have one parameter");
            });
            it('should save the number of training items in countTrainingMsg property', function () {
                var trainingSet = [
                    {type:"spam", content:{'kikou':1, 'lol':1}},
                    {type:"spam", content:{'Xoxo':1, 'mdr':1}},
                    {type:"ham", content:{'Wesh':1, 'poto':1}}
                ];
                classifier.train(trainingSet);
                expect(classifier.countTrainingMsg).to.be.equal(3);
            });
            it('should count the number of \'ham\' message', function () {
                var trainingSet = [
                    {type:"spam", content:{'kikou':1, 'lol':1}},
                    {type:"spam", content:{'Xoxo':1, 'mdr':1}},
                    {type:"ham", content:{'Wesh':1, 'poto':1}}
                ];
                classifier.train(trainingSet);
                expect(classifier.count.ham).to.be.equal(1);
            });
            it('should count the number of \'spam\' message', function () {
                var trainingSet = [
                    {type:"spam", content:{'kikou':1, 'lol':1}},
                    {type:"spam", content:{'Xoxo':1, 'mdr':1}},
                    {type:"ham", content:{'Wesh':1, 'poto':1}}
                ];
                classifier.train(trainingSet);
                expect(classifier.count.spam).to.be.equal(2);
            });
            it('should count the frequency of A word by message type', function () {
                var trainingSet = [
                    {type:"spam", content:{'kikou':1, 'lol':1}},
                    {type:"spam", content:{'kikou':1, 'mdr':1}},
                    {type:"spam", content:{'kikou':1, 'mdr':1, xptdr:'1'}},
                    {type:"ham", content:{'wesh':1, 'poto':1}},
                    {type:"ham", content:{'hello':1, 'world':1}}
                ];
                classifier.train(trainingSet);
                expect(classifier.frequencies.spam['kikou']).to.be.equal(3, 'kikou');
                expect(classifier.frequencies.spam['mdr']).to.be.equal(2, 'mdr');
                expect(classifier.frequencies.spam['lol']).to.be.equal(1, 'lol');
                expect(classifier.frequencies.spam['xptdr']).to.be.equal(1, 'xptdr');
                expect(classifier.frequencies.ham['wesh']).to.be.equal(1, 'wesh');
                expect(classifier.frequencies.ham['poto']).to.be.equal(1, 'poto');
                expect(classifier.frequencies.ham['hello']).to.be.equal(1, 'hello');
                expect(classifier.frequencies.ham['world']).to.be.equal(1, 'world');
            });
        });

        describe("probaType function", function () {

            var classifier;
            beforeEach(function () {
                classifier = new SpamClassifier();
            });

            it('should exist', function () {
                expect(typeof classifier.probaType).equal('function', 'The probaType function from SpamClassifier class should exist');
            });
            it('should have one parameter', function () {
                nbParamsOf(classifier.probaType).should.equal(1, "The probaType method should have one parameter");
            });
            it('should return the count of message of this type divide by the total number of messages.', function () {
                classifier.count = {spam: 7, ham: 3};
                classifier.countTrainingMsg = 10;
                expect(classifier.probaType('spam')).to.be.equal(0.7);
                expect(classifier.probaType('ham')).to.be.equal(0.3);
            });
        });

        describe("probaWord function", function () {

            var classifier;
            beforeEach(function () {
                classifier = new SpamClassifier();
            });

            it('should exist', function () {
                expect(typeof classifier.probaWord).equal('function', 'The probaWord function from SpamClassifier class should exist');
            });
            it('should have two parameters', function () {
                nbParamsOf(classifier.probaWord).should.equal(2, "The probaWord method should have two parameters");
            });
            it('should return the frequency of a word in a message of type \'msgType\' divided by the number of message ' +
                'of this type', function () {
                classifier.count = {spam: 40, ham: 40};
                classifier.frequencies = {
                    spam: {'enlarge': 20, 'mandacash': 30},
                    ham: {'wedding':2}
                };

                expect(classifier.probaWord('enlarge', 'spam')).to.be.equal(0.5);
                expect(classifier.probaWord('mandacash', 'spam')).to.be.equal(0.75);
                expect(classifier.probaWord('wedding', 'ham')).to.be.equal(0.05);
            });
            it('should return a very low value if the word is unknown', function () {
                classifier.count = {spam: 40, ham: 40};
                classifier.frequencies = {
                    spam: {'enlarge': 20, 'mandacash': 30},
                    ham: {'wedding':2}
                };

                expect(classifier.probaWord('aUnknownWord', 'spam')).to.be.closeTo(0.0001, 0.01);
                expect(classifier.probaWord('aUnknownWord', 'ham')).to.be.closeTo(0.0001, 0.01);
            });
        });

        describe("proba function", function () {

            var classifier;
            beforeEach(function () {
                classifier = new SpamClassifier();
                sandbox.spy(window, 'removePunctuationFromText');
                sandbox.spy(window, 'fromTextToBagOfWords');
                sandbox.stub(classifier, 'probaWord').returns(0.0001);
            });

            it('should exist', function () {
                expect(typeof classifier.proba).equal('function', 'The proba function from SpamClassifier class should exist');
            });
            it('should have two parameters', function () {
                nbParamsOf(classifier.proba).should.equal(2, "The proba method should have two parameters");
            });
            it('should call and compose removePunctuationFromText and fromTextToBagOfWords with the text', function () {
                var msg = "This a simple msg. It contains punctuation!";
                classifier.proba(msg, "spam");
                expect(removePunctuationFromText.calledWith(msg)).to.be.true;
                expect(fromTextToBagOfWords.calledWith("this a simple msg  it contains punctuation ")).to.be.true;
            });
            it('should return the product of each word\'s probability', function () {
                classifier.probaWord.returns(2);
                var msg = "This a simple msg. It contains punctuation!",
                    type = "spam";

                var result = classifier.proba(msg, type);

                classifier.probaWord.calledWith("this", type).should.be.true;
                classifier.probaWord.calledWith("a", type).should.be.true;
                classifier.probaWord.calledWith("simple", type).should.be.true;
                classifier.probaWord.calledWith("msg", type).should.be.true;
                classifier.probaWord.calledWith("it", type).should.be.true;
                classifier.probaWord.calledWith("contains", type).should.be.true;
                classifier.probaWord.calledWith("punctuation", type).should.be.true;
                expect(result).equal(128);

            });
        });

        describe("IsSpam function", function () {

            var classifier;
            beforeEach(function () {
                classifier = new SpamClassifier();
                sandbox.stub(classifier, 'proba');
                sandbox.stub(classifier, 'probaType');
            });

            it('should exist', function () {
                expect(typeof classifier.isSpam).equal('function', 'The isSpan function from SpamClassifier class should exist');
            });
            it('should have one parameter', function () {
                nbParamsOf(classifier.isSpam).should.equal(1, "The isSpan method should have one parameter");
            });
            it('should call proba function and probaType function twice times', function () {
                classifier.isSpam("This is a test msg");

                classifier.proba.callCount.should.be.equal(2);
                classifier.probaType.callCount.should.be.equal(2);

                expect(classifier.proba.calledWith("This is a test msg", "spam")).to.be.true;
                expect(classifier.proba.calledWith("This is a test msg", "ham")).to.be.true;
                expect(classifier.probaType.calledWith("ham")).to.be.true;
                expect(classifier.probaType.calledWith("spam")).to.be.true;
            });
            it('should return true TODO sentence', function () {
                classifier.proba.withArgs("This is a test msg", "spam").returns(1);
                classifier.proba.withArgs("This is a test msg", "ham").returns(0.1);
                classifier.probaType.withArgs("spam").returns(1);
                classifier.probaType.withArgs("ham").returns(0.1);
                expect(classifier.isSpam("This is a test msg")).to.be.true;
            });

            it('should return false TODO sentence', function () {
                classifier.proba.withArgs("This is a test msg", "spam").returns(0.1);
                classifier.proba.withArgs("This is a test msg", "ham").returns(1);
                classifier.probaType.withArgs("spam").returns(0.1);
                classifier.probaType.withArgs("ham").returns(1);
                expect(classifier.isSpam("This is a test msg")).to.be.false;
            });
        });
    });
});


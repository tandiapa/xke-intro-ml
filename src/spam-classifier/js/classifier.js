'use strict';

function countKeys(obj) {
    return Object.keys(obj).length;
}

function fromRawToStructured(data) {
    var lines = data.split('\n');

    return lines.map(function (line) {
        var type, contentOffset;

        if (line.substring(0, 3) == 'ham') {
            type = 'ham';
            contentOffset = 5;
        } else {
            type = 'spam';
            contentOffset = 6;
        }

        return {
            type: type,
            content: line.substring(contentOffset)
        };
    }).filter(function (line) {
            return line.content.length > 0;
        });
}

function removePunctuation(structuredData) {
    return structuredData.map(function (item) {
        return {
            type: item.type,
            content: removePunctuationFromText(item.content)
        }
    });
}

function removePunctuationFromText(content) {
    return content
        .replace(/&lt;/, '<')
        .replace(/&gt;/, '>')
        .replace(/&amp;/, '&')
        .replace(/[^\w]/g, ' ')
        .toLowerCase();
}

function bagOfWords(text) {
    return text.map(function (item) {
        return {
            type: item.type,
            content: fromTextToBagOfWords(item.content)
        }
    });
}

function fromTextToBagOfWords(text) {
    return _(text.split(' '))
        .filter(function (token) {
            return token.length > 0;
        })
        .countBy(_.identity)
        .valueOf()
}

function start() {

    mocha.run(function () {
        scroolToFailOrDisplayDemo();
    });

}

function datasetContentLoaded(content) {
    var structuredContent = fromRawToStructured(content),
        trainingData = structuredContent.slice(0, structuredContent.length - 1000),
        validationData = structuredContent.slice(structuredContent.length - 1000, structuredContent.length);

    var transformation = _.compose(
            bagOfWords,
            removePunctuation
        ),
        data = transformation(trainingData),
        classifier = new SpamClassifier();

    classifier.train(data);

    var countAccuratePredictions = validationData
        .filter(function (msg) {
            var msgIsSpam = classifier.isSpam(msg.content);
            return (msgIsSpam && msg.type == 'spam') || (!msgIsSpam && msg.type == 'ham');
        })
        .length;

    var countSpamsInValidation = validationData
        .filter(function(msg) {
            return msg.type == 'spam';
        }).length;

    var correctlyClassified = countAccuratePredictions / validationData.length;

    jQuery('#accuracy').val(100*correctlyClassified);
    jQuery('#dataset').val(100*classifier.count['spam']/classifier.countTrainingMsg);
    jQuery('#validationset').val(100*countSpamsInValidation / validationData.length);

    jQuery('.dial').knob({'readOnly' : true, width : 150});
    jQuery('#dataset, #validationset').trigger('configure', {'fgColor' : '#9061C2'});
}

jQuery.get('SMSSpamCollection', datasetContentLoaded);


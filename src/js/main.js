$(function () {
    "use strict";

    // Dimmer initializing ...
    var $iframe = $('#result');
    var code = "",
        state = {};

    try {
        state = JSON.parse(atob(decodeURIComponent($.url().fparam("state"))));
    } catch (e) {
        console.log("unable to parse the URL");
    }

    state.context = state.context || 'kmeans';
    state['kmeans'] = state['kmeans'] || {};
    state['naive-bayes'] = state['naive-bayes'] || {};

    var contextMapping = {
        'kmeans' : {
            'result-page' : 'kmeans/kmeans.html'
        },
        'naive-bayes' : {
            'result-page' : 'spam-classifier/classifier.html'
        }
    };

    function loadContextFromState(state) {
        editor.setValue(state[state.context].code);
        $iframe[0].contentWindow.location = contextMapping[state.context]['result-page'];
    }

    $('.algo-link').click(function(e) {
        e.preventDefault();
        state.context = $(this).attr('href').substring(1);
        loadContextFromState(state);
    });

    // Ace editor initializing ...
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/ambiance");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    editor.setOptions({
        enableBasicAutocompletion: true
    });

    code = state && state[state.context] && state[state.context].code;

    if (!!code) {
        editor.setValue(code, -1);
    } else {
        setTimeout(function () {
            introJs().setOptions({
                showStepNumbers: false,
                steps: [
                    {
                        element: "#editor",
                        intro: "You will write the code of the algorithms in the text editor",
                        position: "right"
                    },
                    {
                        element: "#result",
                        intro: "Here, you will have a visual representation of what you have implemented",
                        position: "left"
                    },
                    {
                        element: ".item.algo-link.kmean",
                        intro: "You will first implement kmeans.",
                        position: "bottom"
                    },
                    {
                        element: ".item.algo-link.bayes",
                        intro: "... then Naive Bayes",
                        position: "bottom"
                    },
                    {
                        element: ".item.algo-link.shortcuts",
                        intro: "Editor shortcuts can be found here",
                        position: "bottom"
                    },
                    {
                        element: ".item.algo-link.slides",
                        intro: "Presentation slides can be found here",
                        position: "bottom"
                    }
                ]
            }).start();
        }, 200);
    }

    editor.on("change", _.debounce(function () {
        state[state.context] = state[state.context] || {};
        code = editor.getValue();
        state[state.context].code = code;
        window.location.hash = "#state="+ encodeURIComponent(btoa(JSON.stringify(state)));
        $iframe[0].contentWindow.location.reload();
    }, 1000));

    $iframe.load(_.bind(function () {
        var script = $iframe[0].contentWindow.document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = code;
        $iframe[0].contentWindow.document.body.appendChild(script);
        $iframe[0].contentWindow.start();// call start function in the iframe
    }, this));
});

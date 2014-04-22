"use strict";

var express = require('express');
var app = express();

var oneDay = 86400000;

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.bodyParser());
    app.use(express.favicon());
    app.use(express.compress());
    app.use(express.logger('dev'));
    app.use(express.static(__dirname, { maxAge: oneDay }));
});

app.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

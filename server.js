'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

// app.param('counter', function(req, res, next, counter){
//   req.counter =
//   return next()
// });

app.put('/count/:counter', function(req, res) {
  res.send(req.params.counter);
});

app.get('/count/:counter', function(req, res) {
  res.send(req.params.counter);
});

app.post('/count/:counter', function(req, res) {
  res.send(req.params.counter);
});

app.del('/count/:counter', function(req, res) {
  res.send(req.params.counter);
});

app.listen(3000);

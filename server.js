'use strict';

var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var env = process.env.NODE_ENV || 'development';
var mongodbURI = env === 'development' ? 'localhost': process.env.MONGOLAB_URI;

mongoose.connect('mongodb://' + mongodbURI + '/highscores');
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));

var EntrySchema = new mongoose.Schema({
  game: { type: String, required: true },
  player: { type: String, required: true },
  score: { type: Number, required: true },
  gist: {type: String, required: true },
  date: { type: Date, 'default': Date.now },
  comment: {type: String, required: false }
});

var Entry = mongoose.model('Entry', EntrySchema);

function getList(options, cb) {
  options = options || {};
  var query = Entry.find({ game: 'rubegoldbash-0.1.0' }, null, {})
    .lean()
    .sort({ score: options.order || -1 })
    .limit(options.limit || 10);
  query.exec(cb);
}

function addToList(attributes, cb) {
  var item = new Entry(attributes);
  item.set('game', 'rubegoldbash-0.1.0');
  item.save(cb);
}

app.use(express.static(__dirname + '/public'));

// curl http://localhost:5000/
app.get('/', function(req, res) {
  var options = {
    order: req.query.reverse ? -1 : 1,
    limit: req.query.limit || 10
  };
  getList(options, function(err, items) {
    res.type('application/json');
    if (err) {
      res.status(400).send({ error: err.message || 'Undefined error' });
    } else {
      res.send({ items: items });
    }
  });
});

// curl -X POST --data "player=test&score=3000&gist=gist" http://localhost:5000/
app.post('/', function(req, res) {
  addToList(req.body, function(err) {
    res.header('Access-Control-Allow-Origin', '*');
    res.type('application/json');
    if (err) {
      res.status(500).send({ error: err.message || 'Undefined error' });
    } else {
      res.send({ success: true });
    }
  });
});

app.get('/hello', function(request, response) {
  response.send('Hello World!');
});


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

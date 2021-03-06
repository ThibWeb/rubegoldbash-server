'use strict';

var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var swig = require('swig');
var app = express();

var env = process.env.NODE_ENV || 'development';
// heroku config:set NODE_ENV=production
var mongodbURI = env === 'development' ? 'localhost': process.env.MONGOLAB_URI;

mongoose.connect('mongodb://' + mongodbURI + '/highscores');
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));

swig.setDefaults({ cache: false });
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

var EntrySchema = new mongoose.Schema({
  game: { type: String, required: true },
  player: { type: String, required: true },
  score: { type: Number, required: true },
  gist: {type: String, required: true },
  date: { type: Date, 'default': Date.now },
  command: {type: String, required: false },
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

app.get('/', function(req, res) {
  var options = {
    order: -1,
    limit: req.query.limit || 100
  };
  getList(options, function(err, items) {
    res.render('index', { items: items });
  });
});

app.get('/scores.json', function(req, res) {
  var options = {
    order: req.query.reverse ? 1 : -1,
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

app.post('/scores.json', function(req, res) {
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

function scoreToCSV(items) {
  var lines = items.map(function (item, i) {
    return item.score + ',' + item.player;
  });

  lines.sort(function(a, b) {
    a = parseInt(a.split(',')[0], 10);
    b = parseInt(b.split(',')[0], 10);
    return a > b ? -1 : (a === b ? 0 : 1);
  });

  return lines.join('\n') + '\n';
}

// curl -X POST --data "player=awesome&score=30000&gist=gisturl" http://localhost:5000/scores.txt
app.post('/scores.txt', function(req, res) {
  addToList(req.body, function(err) {
    res.header('Access-Control-Allow-Origin', '*');
    res.type('text/plain');
    if (err) {
      res.status(500).send(err.message || 'Undefined error');
    } else {
      var options = {
        order: req.query.reverse ? 1 : -1,
        limit: req.query.limit || 10
      };
      getList(options, function(err, items) {
        if (err) {
          res.status(400).send(err.message || 'Undefined error');
        } else {
          res.send(scoreToCSV(items));
        }
      });
    }
  });
});

// curl http://localhost:5000/scores.txt
app.get('/scores.txt', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.type('text/plain');
  var options = {
    order: req.query.reverse ? 1 : -1,
    limit: req.query.limit || 10
  };
  getList(options, function(err, items) {
    if (err) {
      res.status(400).send(err.message || 'Undefined error');
    } else {
      res.send(scoreToCSV(items));
    }
  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

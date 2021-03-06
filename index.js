require('dotenv').config()
var express = require('express');
var app = express();
var bodyParser = require("body-parser");

const radioService = require('./radio/radio-service');
const playlistService = require('./playlist/playlist-service');
const youtubeService = require('./youtube/youtube-service');
const slackService = require('./slack/slack-service');
const songService = require('./songs/songs-service');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/current', function (req, res, next) {
    radioService.getCurrentSong().then((songData) => {
        res.send(songData);
    }).catch(next);
});

app.get('/playlist', function (req, res, next) {
    playlistService.getAllSongsInPlaylist(function (playlist) {
        res.send(playlist);
    });
});

app.post('/songs', function (req, res, next) {
    if(req.query.youtubelink || req.body.youtubelink) {
        link = req.query.youtubelink || req.body.youtubelink
        console.log(link);
        youtubeService.fetchSongAndAddToStore(link).then((songData) => {
            return playlistService.addSong(songData).then(() => {
                res.send(songData);
            });
        }).catch(next);
    }
});

app.post('/loadall', function (req, res, next) {
    console.log('Inside POst')
    songService.addAllSongsFromS3ToStore().then(() => {
        res.send({});
    })
});

slackService.attachToExpress(app);

app.use(function(err, req, res, next) {
    res.status(500);
    res.send(err);
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

process.on('uncaughtException', function(err) {
    console.log(err);
});

process.on('unhandledRejection', function(reason, p){
    console.log(reason);
});

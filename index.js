var express = require('express');
var app = express();
var bodyParser = require("body-parser");

const radioService = require('./radio/radio-service');
const playlistService = require('./playlist/playlist-service');
const youtubeService = require('./youtube/youtube-service');
const slackService = require('./slack/slack-service');

const slapp = require('./utils/slapp');

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
        // slapp.sendMessage(`:sound: Now playing - ${songData.meta.title}. Listen to it at <https://tiny.cc/rbox-radio|rbox-radio> :notes: :notes:`, '#mojo-radio');
    }).catch(next);
});

app.get('/playlist', function (req, res, next) {
    playlistService.getAllSongsInPlaylist(function (playlist) {
        res.send(playlist);
    });
});

app.post('/songs', function (req, res, next) {
    if(req.query.youtubelink) {
        youtubeService.fetchSongAndAddToStore(req.query.youtubelink).then((songData) => {
            return playlistService.addSong(songData).then(() => {
                res.send(songData);
            });
        }).catch(next);
    }
});

slapp.attachToExpress(app);

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
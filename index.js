var express = require('express');
var app = express();
var bodyParser = require("body-parser");

const radioService = require('./radio/radio-service');
const playlistService = require('./playlist/playlist-service');
const youtubeService = require('./youtube/youtube-service');
const slackService = require('./slack/slack-service');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.render('index');
});

app.get('/current', function (request, response) {
    radioService.getCurrentSong().then((songData) => {
        response.send(songData);
    });
});

app.get('/playlist', function (req, res) {
    playlistService.getAllSongsInPlaylist(function (playlist) {
        res.send(playlist);
    })
});

app.post('/songs', function (req, res) {
    if(req.query.youtubelink) {
        youtubeService.fetchSongAndAddToStore(req.query.youtubelink).then((songData) => {
            return playlistService.addSong(songData.songId).then(() => {
                res.send(songData);
            });
        });
    }
});

app.post('/slack', function (req, res) {
    slackService.handleIncomingSlackData(req.body);
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

var express = require('express');
var app = express();
const radioService = require('./radio/radio-service');
const playlistService = require('./playlist/playlist-service');
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


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

app.get('/add_songs', function (req, res) {
    addAllSongsInS3ToPlaylist();
    res.send('Success!!')
});

function respond(data) {
    return {
        statusCode: '200',
        body: data,
        headers: {
            contentType: 'text/json',
            'Access-Control-Allow-Origin': '*'
        }
    }
}


function addAllSongsInS3ToPlaylist(callback) {
    s3.listObjectsV2({
        Bucket: BUCKET,
        Prefix: MUSIC_FOLDER
    }, function (err, response) {
        var songs = response.Contents;

        songs.map(function (songToPlay) {
            musicmetadata(getSongStreamFromS3(songToPlay.Key), {
                duration: true,
                fileSize: songToPlay.Size
            }, function (err, meta) {
                delete meta.picture; //dont need the pic... yet
                meta['song_id'] = uuidv1();
                meta['addedOn'] = Date.now();
                meta['s3_url'] = BUCKET_URL + songToPlay.Key;
                console.log(meta)
                if (meta.duration > 0) {
                    addSong(meta)
                }
            });
        });

    });
}

function fetchCurrentSong(should_play_next_song, callback) {
    getCurrentSongFile(function (err, currentSongFile) {
        var currentSongMeta = currentSongFile ? JSON.parse(currentSongFile.Body) : {};
        var hasCurrentSongEnded = Math.floor(currentSongMeta.addedOn + currentSongMeta.duration * 1000) < Date.now();
        if (err || hasCurrentSongEnded || should_play_next_song) {
            return changeSong(function (err, newSongData) {
                callback(err, respond(newSongData));
            })
        }
        callback(err, respond(JSON.stringify(currentSongMeta)));

    });
}

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

var express = require('express');
var app = express();
app.set('port', (process.env.PORT || 5000));
var aws = require('aws-sdk');
var musicmetadata = require('musicmetadata');
const BUCKET = 'mojo-jojo';
// const CURRENT_SONG_KEY = 'current-song.json';
const MUSIC_FOLDER = 'music/';
const uuidv1 = require('uuid/v1');
const BUCKET_URL = 'https://s3.ap-south-1.amazonaws.com/' + BUCKET + '/';
const aws_cred = {
    accessKeyId: 'AKIAJN64RUOIE7SJCYZA',
    secretAccessKey: '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',
    region: 'us-east-1'
};
var redis_service = require('./redis_service');


aws.config = new aws.Config(aws_cred);
var s3 = new aws.S3();

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.get('/', function (request, response) {
    response.render('index');
});

app.get('/current', function (request, response) {
    redis_service.getCurrentSong(function (current_song) {
        response.send(current_song);
    })
});

app.get('/playlist', function (req, res) {
    redis_service.getAllSongsInPlaylist(function (playlist) {
        res.send(playlist);
    })
});

app.get('/add_songs', function (req, res) {
    addAllSongsInS3ToPlaylist(function (err, response) {
        res.send('Success!!')
    });
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

function addSong(payload) {
    addSongToQueue(payload.song_id);
    addSongToAllSongsList(payload);
}

function addSongToQueue(song_id, callback) {
    redis_service.pushSongToPlayList(song_id, callback)
}

function addSongToAllSongsList(song_data, callback) {
    redis_service.setSongDetailsToStore(song_data, callback)
}

function getCurrentSongFile(callback) {
    // s3.getObject({
    //     Bucket: BUCKET,
    //     Key: CURRENT_SONG_KEY
    // }, callback)
    redis_service.getCurrentSong(callback)
}

function getSongStreamFromS3(Key) {
    return s3.getObject({
        Bucket: BUCKET,
        Key: Key
    }).createReadStream()
}

// function updateCurrentSongFile(data, callback) {
//     s3.putObject({
//         Bucket: BUCKET,
//         Key: CURRENT_SONG_KEY,
//         ContentType: 'text/json',
//         Body: JSON.stringify(data)
//     }, callback)

// }

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

var aws = require('aws-sdk');
var s3 = new aws.S3();
var musicmetadata = require('musicmetadata');

const BUCKET = 'mojo-jojo';
const CURRENT_SONG_KEY = 'current-song.json';
const MUSIC_FOLDER = 'music/';
const BUCKET_URL = 'https://s3.ap-south-1.amazonaws.com/' + BUCKET + '/';

exports.handler = (event, context, callback) => {
    getCurrentSongFile(function (err, currentSongFile) {
        let currentSongMeta = currentSongFile ? JSON.parse(currentSongFile.Body) : {};
        let hasCurrentSongEnded = Math.floor(currentSongMeta.addedOn + currentSongMeta.duration*1000) < Date.now();
        
        if (err || hasCurrentSongEnded) {
            return changeSong(function (err, newSongData) {
                callback(err, respond(newSongData));
            })
        }

        callback(err, respond(JSON.stringify(currentSongMeta)));
    })
};

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

function getCurrentSongFile(callback) {
    s3.getObject({
        Bucket: BUCKET,
        Key: CURRENT_SONG_KEY
    }, callback)
}

function getSongStreamFromS3(Key) {
    return s3.getObject({
        Bucket: BUCKET,
        Key: Key
    }).createReadStream()
}

function updateCurrentSongFile(data, callback) {
    s3.putObject({
        Bucket: BUCKET,
        Key: CURRENT_SONG_KEY,
        ContentType: 'text/json',
        Body: JSON.stringify(data)
    }, callback)
}

function changeSong(callback) {
    s3.listObjectsV2({
        Bucket: BUCKET,
        Prefix: MUSIC_FOLDER
    }, function(err, response) {
        let songs = response.Contents;

        songs.splice(0, 1);

        let randomIndex = Math.floor((Math.random()*1000) % songs.length);
        let songToPlay = songs[randomIndex];

        musicmetadata(getSongStreamFromS3(songToPlay.Key), {duration: true}, function(err, meta) {
            delete meta.picture; //dont need the pic... yet

            meta['addedOn'] = Date.now();
            meta['url'] = BUCKET_URL + songToPlay.Key;
            
            updateCurrentSongFile(meta, function(err, data) {
                if (err) {
                    return callback(err);
                }

                return callback(null, JSON.stringify(meta));
            });
        });

    });
}
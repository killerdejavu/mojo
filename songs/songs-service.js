const debug = require('debug')('mojo:songs-service');
const musicmetadata = require('musicmetadata');
const shortid = require('shortid');

const s3 = require('../utils/s3');
const config = require('../config');
const redisClient = require('../utils/redis');

const REDIS_SONG_KEY_PREFIX = config.REDIS_SONG_KEY_PREFIX;

function getSongStreamFromS3(Key) {
    return s3.getObject({
        Key: Key
    }).createReadStream()
}

function putSongToS3(songData) {

    debug('putting song to s3 with id %s', songData.songId);

    return new Promise((resolve, reject) => {
        s3.upload({
            Key: config.MUSIC_FOLDER + songData.songId + '.' + songData.fileExtension,
            Body: songData.song,
            ContentType: songData.audioFormat,
            ACL: 'public-read'
        }, (err, response) => {
            if(err) return reject(err);

            debug('successfully put song to s3 with response %O', response);

            resolve({
                s3Response: response,
                songData: songData
            });
        });
    });
}

function putSongToRedis(songData) {

    debug('putting song to redis with id %s', songData.songId);

    return new Promise((resolve, reject) => {
        redisClient.set(REDIS_SONG_KEY_PREFIX + songData.songId, JSON.stringify(songData), (err, response) => {
            if(err) return reject(err);

            debug('successfully put song data into redis');

            resolve({
                redisResponse: response,
                songData: songData
            });
        });
    });
}

function putSong(songData) {
    return putSongToS3(songData).then((response) => {
        songData.s3Url = response.s3Response.Location;
        delete songData.song;

        return putSongToRedis(response.songData);
    }).then((response) => response.songData)
}

function getSong(songId) {
    const songKey = songId.startsWith(REDIS_SONG_KEY_PREFIX) ? songId : REDIS_SONG_KEY_PREFIX + songId;
    debug('getting song from store with key %s', songKey);

    return new Promise((resolve, reject) => {
        redisClient.get(songKey, function (err, response) {
            if(err) return reject(err);

            debug('got song %O', response);

            resolve(JSON.parse(response));
        });
    });
}

function getRandomSong() {
    return new Promise((resolve, reject) => {
        redisClient.keys(REDIS_SONG_KEY_PREFIX+'*', (err, response) => {
            if(err) return reject(err);
            resolve(getSong(response[Math.floor(Math.random()*1000) % response.length]))
        });
    })
}

function addAllSongsFromS3ToStore() {
    s3.listObjectsV2({
        Prefix: config.MUSIC_FOLDER
    }, function (err, response) {
        var songs = response.Contents;

        songs.map(function (songToPlay) {
            if(songToPlay.Key.endsWith('.mp3')) {
                musicmetadata(getSongStreamFromS3(songToPlay.Key), {
                    duration: true,
                    fileSize: songToPlay.Size
                }, function (err, meta) {
                    delete meta.picture; //dont need the pic... yet

                    let songData = {
                        meta: meta,
                        s3Url: config.S3_BUCKET_URL + songToPlay.Key,
                        songId: shortid.generate()
                    };

                    debug('putting song to redis %O', songData);

                    if (meta.duration > 0) {
                        putSongToRedis(songData)
                    }
                });
            }
        });
    });
}

module.exports = {
    putSong: putSong,
    getSong: getSong,
    getRandomSong: getRandomSong,
    addAllSongsFromS3ToStore: addAllSongsFromS3ToStore
};
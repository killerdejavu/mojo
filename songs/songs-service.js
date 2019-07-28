const debug = require('debug')('mojo:songs-service');
const musicmetadata = require('musicmetadata');
const shortid = require('shortid');
const shuffle = require('lodash.shuffle');

const s3 = require('../utils/s3');
const config = require('../config');
const redisClient = require('../utils/redis');

const REDIS_SONG_KEY_PREFIX = config.REDIS_SONG_KEY_PREFIX;
const REDIS_RANDOM_LIST_KEY = config.REDIS_RANDOM_LIST_KEY;

function getSongStreamFromS3(Key) {
    return s3.getObject({
        Key: Key
    }).createReadStream()
}

function putSongToS3(songData) {

    debug('putting song to s3 with id %s', songData.songId);

    return new Promise((resolve, reject) => {
        console.log(config.MUSIC_FOLDER + songData.songId + '.' + songData.fileExtension)
        s3.upload({
            Key: config.MUSIC_FOLDER + songData.songId + '.' + songData.fileExtension,
            Body: songData.song,
            ContentType: songData.audioFormat,
            ACL: 'public-read'
        }, (err, response) => {
            if(err) {
                console.log(err)
                return reject(err);
            }

            debug('successfully put song to s3 with response %O', response);

            resolve({
                s3Response: response,
                songData: songData
            });
        });
    });
}

function putSongToRedis(songData) {

    console.log('putting song to redis with id %s', songData.songId);

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
    console.log(songData)
    return putSongToS3(songData).then((response) => {
        songData.s3Url = response.s3Response.Location;
        delete songData.song;

        return putSongToRedis(response.songData);
    }).then((response) => response.songData)
}

function getSong(songId) {
    console.log(songId)
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

function getAllSongs() {
    return new Promise((resolve, reject) => {
        redisClient.keys(REDIS_SONG_KEY_PREFIX+'*', (err, response) => {
            if(err) return reject(err);
            resolve(response);
        });
    })
}

function getSongFromRandomList() {
    return new Promise((resolve, reject) => {
        redisClient.lpop(REDIS_RANDOM_LIST_KEY, (err, response) => {
            if(err) return reject(err);
            resolve(response);
        });
    })
}

function putSongsInRandomList() {
    return getAllSongs().then((songs) => {
        const shuffledSongs = shuffle(songs);
        const multi = redisClient.multi();

        shuffledSongs.forEach((song) => {
            multi.rpush(REDIS_RANDOM_LIST_KEY, song);
        });

        return new Promise((resolve, reject) => {
            multi.exec((err, response) => {
                if(err) return reject(err);
                resolve(shuffledSongs);
            });
        });
    })
}

function isRandomListEmpty() {
    return new Promise((resolve, reject) => {
        redisClient.exists(REDIS_RANDOM_LIST_KEY, (err, response) => {
            if(err) return reject(err);
            resolve(!response);
        });
    });
}

function getRandomSong() {
    return isRandomListEmpty().then((isEmpty) => {
        debug('isRandomListEmpty %s', isEmpty);
        if (!isEmpty) return getSongFromRandomList().then(getSong);
        return putSongsInRandomList().then(getSongFromRandomList).then(getSong);
    });
}

function addAllSongsFromS3ToStore() {
    console.log('Running addAllSongsFromS3ToStore...');
    return s3.listObjectsV2({
        Prefix: config.MUSIC_FOLDER
    }, function (err, response) {
        var songs = response.Contents;
        songs.map(function (songToPlay) {
            console.log(songToPlay.Key);
            if(songToPlay.Key.endsWith('.webm')) {
                console.log('get metdata...');
                musicmetadata(getSongStreamFromS3(songToPlay.Key), {
                    duration: true,
                    fileSize: songToPlay.Size
                }, function (err, meta) {
                    delete meta.picture; //dont need the pic... yet
                    console.log('error...');
                    console.log(err);
                    console.log('error done...');
                    let songData = {
                        meta: meta,
                        s3Url: config.S3_BUCKET_URL + songToPlay.Key,
                        songId: shortid.generate()
                    };

                    debug('putting song to redis %O', songData);
                    console.log('putting the song to redis ', songData.songId);
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

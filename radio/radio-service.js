const debug = require('debug')('mojo:radio-service');
const redisClient = require('../utils/redis');
const REDIS_CURRENT_SONG_KEY = require('../config').REDIS_CURRENT_SONG_KEY;
const songService = require('../songs/songs-service');
const playlistService = require('../playlist/playlist-service');
const slackService = require('../slack/slack-service');

function getCurrentSong() {
    return getCurrentSongDetails().then((songData) => {
        const hasSongEnded = songData && (songData.meta.duration*1000 + songData.startedPlayingOn) < Date.now();

        debug('has song ended %s', hasSongEnded);
        if(!songData || hasSongEnded) {
            return playlistService.getSong().then((songId) => {
                if(!songId) {
                    debug('getting random song');
                    return songService.getRandomSong().then((songData) => setCurrentSongDetails(songData.songId));
                }
                return setCurrentSongDetails(songId)
            })
        }

        return songData;
    })
}

function setCurrentSongDetails(songId) {
    debug('setting current song as %s', songId);
    return new Promise((resolve, reject) => {
        songService.getSong(songId).then((songData) => {
            songData['startedPlayingOn'] = Date.now();
            redisClient.set(
                REDIS_CURRENT_SONG_KEY,
                JSON.stringify(songData),
                (err, response) => {
                    if (err) return reject(err);
                    slackService.sendDataToSlackChannel(`The song ${songData.meta.title} has started.. Listed to it at <https://tiny.cc/rbox-radio|rbox-radio>`);
                    resolve(songData);
                });
        });
    });
}

function getCurrentSongDetails() {
    return new Promise((resolve, reject) => {
        redisClient.get(REDIS_CURRENT_SONG_KEY, function (err, response) {
            if (err) return reject(err);
            debug('got current song as %O', response);
            resolve(JSON.parse(response));
        });
    });
}

module.exports = {
    getCurrentSong: getCurrentSong
};
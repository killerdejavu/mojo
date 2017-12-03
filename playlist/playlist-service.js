const debug = require('debug')('mojo:playlist-service');
const redisClient = require('../utils/redis');
const REDIS_KEY_NAMESPACE = require('../config').REDIS_KEY_NAMESPACE;
const REDIS_SONG_KEY_PREFIX = require('../config').REDIS_SONG_KEY_PREFIX;

const playlistKey = REDIS_KEY_NAMESPACE + 'playlist';

function addSong(songId) {
    return new Promise((resolve, reject)=>{
        debug('adding song to playlist %s', songId);
        redisClient.rpush(playlistKey, songId, (err, response) => {
            if (err) return reject(err);
            resolve(songId);
        });
    });
}

function getSong() {
    return new Promise((resolve, reject) => {
        redisClient.lpop(playlistKey, (err, response) => {
            if (err) return reject(err);
            debug('getting song from playlist %s', response);
            resolve(response);
        })
    })
}

module.exports = {
    addSong: addSong,
    getSong: getSong,
    getAllSongsInPlaylist: function (callback) {
        redisClient.lrange(playlistKey, 0, -1, function (err, songIds) {

            songIds = songIds.map((songId) => REDIS_SONG_KEY_PREFIX + songId);

            redisClient.mget(songIds, function (err, all_songs) {
                if (!all_songs) {
                    console.log('no songs in playlist');
                    return callback([])
                }
                var total_playing_time = 0;
                var all_songs_data = all_songs.map(function (song_raw) {
                    var parsed_data = JSON.parse(song_raw);
                    total_playing_time += parsed_data.meta.duration;
                    return parsed_data
                });
                return callback({'total_playing_time_in_mins': total_playing_time, 'songs_in_order': all_songs_data})
            })
        });
    }
};
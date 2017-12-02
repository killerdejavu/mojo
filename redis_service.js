var redis = require('redis');
var moment = require('moment');

var redis_client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

module.exports = {

    pushSongToPlayList: function (song_id, callback) {
        redis_client.rpush('playlist', song_id, callback);
    },

    popFirstSongFromPlaylist: function (callback) {
        redis_client.lpop('playlist', callback)
    },

    getCurrentSong: function (callback) {
        this.getCurrentSongDetails(function (current_song_id, starting_timestamp, ending_timestamp) {
            var current_time = moment();
            var should_current_song_not_change = current_song_id && current_time.isBetween(moment(starting_timestamp), moment(ending_timestamp), 'second');
            console.log('current time', current_time);
            console.log('starting timestamp', starting_timestamp);
            console.log('ending timestamp', ending_timestamp);
            console.log('should change song ? - ', !should_current_song_not_change);
            console.log('------------');
            if (!should_current_song_not_change) {
                this.popFirstSongFromPlaylist(function (err, song_id) {
                    this.setCurrentSongDetails(song_id);
                    return this.getSongDetailsFromStore(song_id, function (song_data) {
                        song_data['start_time'] = starting_timestamp;
                        song_data['ending_time'] = ending_timestamp;
                        callback(song_data)
                    });
                }.bind(this));

            }
            else {
                return this.getSongDetailsFromStore(current_song_id, function (song_data) {
                    song_data['start_time'] = starting_timestamp;
                    song_data['ending_time'] = ending_timestamp;
                    callback(song_data)
                })
            }
        }.bind(this))
    },

    setSongDetailsToStore: function (data, callback) {
        redis_client.set(data.song_id, JSON.stringify(data), callback);
    },

    getSongDetailsFromStore: function (song_id, callback) {
        redis_client.get(song_id, function (err, response) {
            if (response) {
                var song_data = JSON.parse(response);
                callback(song_data)
            }
            return null;
        });

    },

    setCurrentSongDetails: function (song_id, callback) {
        this.getSongDetailsFromStore(song_id, function (song_data) {
            var duration = song_data.duration;
            redis_client.hmset(
                'current_song',
                'song_id', song_id,
                'starting_timestamp', moment().valueOf(),
                'ending_timestamp', moment().add(duration, 'second').valueOf(),
                callback);
        });
    },

    getCurrentSongDetails: function (callback) {
        redis_client.hmget('current_song', 'song_id', 'starting_timestamp', 'ending_timestamp', function (err, response) {
            console.log(err);
            if (!response) return callback(null, null, null);
            var song_id = response[0];
            if (!song_id) return callback(null, null, null);
            var starting_timestamp = response[1];
            var ending_timestamp = response[2];
            callback(song_id, starting_timestamp, ending_timestamp);
        });
    },

    getAllSongsInPlaylist: function (callback) {
        redis_client.lrange("playlist", 0, -1, function (err, song_ids) {
            redis_client.mget(song_ids, function (err, all_songs) {
                if (!all_songs) {
                    console.log('no songs in playlist');
                    return callback([])
                }
                var total_playing_time = 0;
                var all_songs_data = all_songs.map(function (song_raw) {
                    var parsed_data = JSON.parse(song_raw);
                    total_playing_time += parsed_data.duration;
                    return parsed_data
                });
                return callback({'total_playing_time_in_mins': total_playing_time/60, 'songs_in_order': all_songs_data})
            })
        });
    }
};

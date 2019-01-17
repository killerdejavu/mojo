const debug = require('debug')('mojo:slack-service');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const slapp = require('../utils/slapp');
const config = require('../config');

slapp.message('(^play|search|add) ([a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*)$', ['direct_mention', 'direct_message', 'mention'],
    (msg, completeText, command, query) => {
        debug(command);
        debug(query);
        youtubeService.searchSong(query).then((results) => respondWithResults(msg, results));
    });

slapp.message('^(<.*>)*\w?(play|search|add) ([a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*)\w?(<.*>)*', ['direct_mention', 'direct_message', 'mention'],
    (msg, completeText, mention, command, query) => {
        debug(command);
        debug(query);
        youtubeService.searchSong(query).then((results) => respondWithResults(msg, results));
    });

slapp.event('app_mention', (msg) => {

    let text = msg.body.event.text;
    let match = text.match(new RegExp(`^<@${config.SLACK_BOT_USER_ID}>:{0,1}(.*)`));
    if (match) {
        text = match[1].trim()
    }

    let regex = '^(<.*>)*\w?(play|search|add) ([a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*)\w?(<.*>)*';
    let criteria = new RegExp(regex, 'i');
    match = text.match(criteria);

    if (match && match.length >= 4 && match[3]) {
        let query = match[3];
        youtubeService.searchSong(query).then((results) => respondWithResults(msg, results));
        return
    }

    regex = '^(<.*>)*w?(play|add) <([(http(s)?):\\/\\/(www\\.)?a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*))|.*> .*';
    criteria = new RegExp(regex, 'i');
    match = text.match(criteria);

    if (match && match.length >= 4 && match[3]) {
        let link = match[3];
        debug(link);
        return fetchAndAddSongFromYoutube(link)
        .then((songData) => respondWithSongData(msg, songData))
        .catch((err) => {
            return respondWithError(msg, err.message || err);
        });
    }

    debug('query didnt match')
});

slapp.message('^(<.*>)*\w?(play|add) <([(http(s)?):\\/\\/(www\\.)?a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*))|.*> .*',
    ['direct_mention', 'direct_message', 'mention'],
    (msg, mention, completeText, command, link) => {
        debug(command);
        debug(link);

        fetchAndAddSongFromYoutube(link)
        .then((songData) => respondWithSongData(msg, songData))
        .catch((err) => {
            return respondWithError(msg, err.message || err);
        });
    });

slapp.action('addToPlaylist', 'link', (msg, response) => {

    const link = response.split('|')[0];
    const title = response.split('|')[1];

    debug('action %O', msg.body);

    msg.respond(msg.body.response_url, `:hourglass: Adding the song - ${title}...`);

    fetchAndAddSongFromYoutube(link)
    .then((songData) => {
        debug('got the song data %O', songData);
        slapp.sendMessage(`:white_check_mark: Added to playlist - ${songData.meta.title}`, null, msg.body.channel.id);
    })
    .catch((err) => {
        slapp.sendMessage(err.message || err, null, msg.body.channel.id);
    });
});

slapp.command('/mojo', 'playlist', (msg, text, name) => {
    debug('In the command');
    playlistService.getAllSongsInPlaylist(function (playlist) {
        let songs = playlist.songs_in_order;
        if (songs) {
            let text = "Current Playlist \n";
            let number = 1;
            songs.forEach((song) =>  {
                text = text + `${number}. ${song.meta.title} \n`;
                number = number + 1;
            });
            msg.respond({text: text, response_type: 'in_channel'})
        }
        else {
            msg.respond({text: 'No songs in playlist. It will pickup random songs! :dancer: :dancer:', response_type: 'in_channel'})
        }

    });
});

function fetchAndAddSongFromYoutube(link) {
    return youtubeService.fetchSongAndAddToStore(link).then((songData) => {
        return playlistService.addSong(songData);
    });
}

function respondWithResults(msg, results) {
    const attachments = results.map((result) => {
        let attachment = {};

        attachment.title = result.snippet.title;
        attachment.title_link = `https://youtube.com/watch?v=${result.id.videoId}`;
        attachment.author_name = result.snippet.channelTitle;
        attachment.thumb_url = result.snippet.thumbnails.default.url;
        attachment.callback_id = 'addToPlaylist';
        attachment.actions = [
            {
                name: 'link',
                text: 'Add to playlist',
                type: 'button',
                style: 'primary',
                value: attachment.title_link + '|' + result.snippet.title
            }
        ];

        return attachment;
    });

    slapp.sendEphemeralMessage('', attachments, msg.body.event.user, msg.body.event.channel);
}

function respondWithSongData(msg, songData) {
    debug('added from slack %O', songData);
    msg.say(`:white_check_mark: Added to playlist - ${songData.meta.title}`);
}

function respondWithError(msg, err) {
    debug('an error occurred: %s', err);
    msg.say(err);
}

module.exports = slapp;
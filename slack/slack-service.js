const debug = require('debug')('mojo:slack-service');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const slapp = require('../utils/slapp');

slapp.message('(^play|search|add) ([a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*)$', ['direct_message'],
    (msg, completeText, command, query) => {
        debug(command);
        debug(query);
        youtubeService.searchSong(query).then((results) => respondWithResults(msg, results));
    });

slapp.message('^(<.*>)*\w?(play|search|add) ([a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*)\w?(<.*>)*', ['direct_mention', 'mention', 'app_mention'],
    (msg, completeText, mention, command, query) => {
        debug(command);
        debug(query);
        youtubeService.searchSong(query).then((results) => respondWithResults(msg, results));
    });

slapp.message('^(<.*>)*\w?(play|add) <([(http(s)?):\\/\\/(www\\.)?a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*))|.*> .*',
    ['direct_message', 'direct_mention', 'mention', 'app_mention'],
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
                value: attachment.title_link+'|'+result.snippet.title
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
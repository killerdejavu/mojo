const debug = require('debug')('mojo:slack-service');
const axios = require('axios');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const songService = require('../songs/songs-service');
const config = require('../config');
const random = require('../utils/random')();

const ERROR_MESSAGES = {
    noLink: [
        'Now where did I put my Klingon dictionary? :mag:',
        'I\'m not very good at conversations (yet). But playing songs from Youtube? That\'s what I do best! Try pasting a Youtube link.',
        '<https://en.wikipedia.org/wiki/What_we%27ve_got_here_is_failure_to_communicate | What we\'ve got here is failure to communicate.>',
        '<https://en.wikipedia.org/wiki/Taxi_Driver#.22You_talkin.27_to_me.3F.22 | You talkin\' to me?>'
    ]
};

function isValidSlackRequest(slackData) {
    return !slackData.bot_id && config.SLACK_VALID_TOKENS.indexOf(slackData.token) >= 0;
}

function handleIncomingSlackData(slackData) {

    debug('Incoming slack data - ', slackData);

    if (isValidSlackRequest(slackData)) {

        const parsedYoutubeLinks = youtubeService.parseYoutubeLinksFromText(slackData.text);

        if (parsedYoutubeLinks.length > 0) {

            parsedYoutubeLinks.forEach(function (youtubeLink) {

                youtubeService.getVideoIdFromLink(youtubeLink)
                    .then(songService.getSong)
                    .then((existingSongData) => {

                        if (existingSongData && existingSongData.songId) {
                            return addSongToPlaylist(existingSongData);
                        }

                        return youtubeService.fetchSongAndAddToStore(youtubeLink).then((songData) => {
                            return addSongToPlaylist(songData);
                        });

                    })
                    .catch((err) => {
                        return respondWithError(err.message);
                    });

            });
        }
    }
    else {
        debug('token failure')
    }
}

function sendDataToSlackChannel(text) {
    axios.post(config.SLACK_OUTGOING_URL, {
        text: text
    });
}

function addSongToPlaylist(songData) {
    playlistService.addSong(songData.songId).then(() => respondWithSongData(songData));
}

function respondWithSongData(songData) {
    debug('added from slack %O', songData);
    sendDataToSlackChannel(`:white_check_mark: Added to playlist - ${songData.meta.title}`);
}

function respondWithError(err) {
    sendDataToSlackChannel(err);
    debug('an error occurred: %s', err);
}

module.exports = {
    handleIncomingSlackData: handleIncomingSlackData,
    sendDataToSlackChannel: sendDataToSlackChannel
};
const debug = require('debug')('mojo:slack-service');
const axios = require('axios');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const songService = require('../songs/songs-service');
const config = require('../config');

function isValidSlackRequest(token) {
    return config.SLACK_VALID_TOKENS.indexOf(token) >= 0;
}

function handleIncomingSlackData(slackData) {

    debug('Incoming slack data - ', slackData);

    if (isValidSlackRequest(slackData.token)) {

        const parsedYoutubeLinks = youtubeService.parseYoutubeLinksFromText(slackData.text);

        if (parsedYoutubeLinks.length > 0) {

            parsedYoutubeLinks.forEach(function (youtubeLink) {

                youtubeService.getVideoIdFromLink(youtubeLink)
                    .then(songService.getSong)
                    .then((existingSongData) => {

                        if (existingSongData && existingSongData.songId) {
                            return addSongToPlaylist(existingSongData);
                        }

                        youtubeService.fetchSongAndAddToStore(youtubeLink).then((songData) => {
                            return addSongToPlaylist(songData);
                        });

                    })
                    .catch((err) => {
                        return respondWithError(err, youtubeLink);
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
    })
}

function addSongToPlaylist(songData) {
    playlistService.addSong(songData.songId).then(() => respondWithSongData(songData))
}

function respondWithSongData(songData) {
    debug('added from slack %O', songData);
    sendDataToSlackChannel(`:white_check_mark: Added to playlist - ${songData.meta.title}`);
}

function respondWithError(err, youtubeLink) {
    sendDataToSlackChannel(`We could not add the song: ${youtubeLink}. ${err}.`);
    debug('an error occurred: %s', err);
}

module.exports = {
    handleIncomingSlackData: handleIncomingSlackData,
    sendDataToSlackChannel: sendDataToSlackChannel
};
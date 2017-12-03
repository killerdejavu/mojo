const debug = require('debug')('slack-service');
const axios = require('axios');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const config = require('../config');

function isValidSlackRequest(token) {
    return config.SLACK_VALID_TOKENS.indexOf(token);
}

function handleIncomingSlackData(slack_data) {
    if (isValidSlackRequest(slack_data.token)) {
        const parsed_youtube_links = youtubeService.parseYoutubeLinksFromText(slack_data.text);
        if (parsed_youtube_links.length > 0) {
            parsed_youtube_links.forEach(function (youtube_link) {
                youtubeService.fetchSongAndAddToStore(youtube_link).then((songData) => {
                    return playlistService.addSong(songData.songId).then(() => {
                        sendDataToSlackChannel(`The song ${songData.meta.title} has been added to the playlist.. `);
                        debug('playing song from slack %O', songData)
                    });
                }).catch((err) => {
                    sendDataToSlackChannel(`We could not add the song: ${youtube_link}.. please try again`);
                    debug('an error occured: %s', err);
                });
            });
        }
    }
}

function sendDataToSlackChannel(text) {
    axios.post(config.SLACK_OUTGOING_URL, {
        text: text
    })

}

module.exports = {
    handleIncomingSlackData: handleIncomingSlackData,
    sendDataToSlackChannel: sendDataToSlackChannel
};
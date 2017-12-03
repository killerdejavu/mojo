const debug = require('debug')('slack-service');
const axios = require('axios');
var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const config = require('../config');

function isValidSlackRequest(token) {
    return config.SLACK_VALID_TOKENS.indexOf(token) >= 0;
}

function handleIncomingSlackData(slack_data) {
    debug('Incoming slack data - ', slack_data);
    if (isValidSlackRequest(slack_data.token)) {
        const parsed_youtube_links = youtubeService.parseYoutubeLinksFromText(slack_data.text);
        if (parsed_youtube_links.length > 0) {
            parsed_youtube_links.forEach(function (youtube_link) {
                youtubeService.fetchSongAndAddToStore(youtube_link).then((songData) => {
                    return playlistService.addSong(songData.songId).then(() => {
                        sendDataToSlackChannel(`:white_check_mark: Added to playlist - ${songData.meta.title} `);
                        debug('playing song from slack %O', songData)
                    });
                }).catch((err) => {
                    sendDataToSlackChannel(`We could not add the song: ${youtube_link}.. please try again later :sob: :sob:`);
                    debug('an error occured: %s', err);
                });
            });
        }
    }
    else {
        console.log('token failure')
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
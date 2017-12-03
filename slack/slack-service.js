var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');
const axios = require('axios');

function isValidSlackRequest(token) {
    return token === "1avbAdJLErZeZ7VoclM0um2b";
}

function parseYoutubeLinksFromText(str) {
    const regex = /(?:https?:\/\/)(?:www\.)?(?:youtube|youtu)\.(?:be|com)\/[^\s]+/g;
    let m;

    let youtube_links = [];
    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            youtube_links.push(match);
        });
    }

    return youtube_links
}

function handleIncomingSlackData(slack_data) {
    if (isValidSlackRequest(slack_data.token)) {
        const parsed_youtube_links = parseYoutubeLinksFromText(slack_data.text);
        if (parsed_youtube_links.length > 0) {
            parsed_youtube_links.forEach(function (youtube_link) {
                youtubeService.fetchSongAndAddToStore(youtube_link).then((songData) => {
                    return playlistService.addSong(songData.songId).then(() => {
                        console.log('playing song from slack', songData)
                    });
                });
            });
        }
    }
}

function sendDataToSlackChannel() {
    let hook_url = 'https://hooks.slack.com/services/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';
    axios.post(hook_url, {
        text: 'New song is starting'
    })
}


module.exports = {
    handleIncomingSlackData: handleIncomingSlackData,
    sendDataToSlackChannel: sendDataToSlackChannel
};
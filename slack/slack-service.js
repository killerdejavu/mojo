const debug = require('debug')('slack-service');
const axios = require('axios');

var youtubeService = require('../youtube/youtube-service');
var playlistService = require('../playlist/playlist-service');

function isValidSlackRequest(token) {
    return token === "1avbAdJLErZeZ7VoclM0um2b" || token === "7lT991VEoNVG3o0dsTYnBGyG";
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
                try {
                    youtubeService.fetchSongAndAddToStore(youtube_link).then((songData) => {
                        return playlistService.addSong(songData.songId).then(() => {
                            sendDataToSlackChannel(`The song ${songData.meta.title} has been added to the playlist.. `);
                            debug('playing song from slack %O', songData)
                        });
                    }).catch((err) => {
                        sendDataToSlackChannel(`We could not add the song: ${songData.meta.title}.. please try again`);
                        debug('an error occured: %s', err);
                    });
                } catch (err) {
                    sendDataToSlackChannel(`We could not add the song: ${songData.meta.title}.. please try again`);
                    debug('an error occured: %s', err);
                }
            });
        }
    }
}

function sendDataToSlackChannel(text) {
    let hook_url = 'https://hooks.slack.com/services/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';
    axios.post(hook_url, {
        text: text
    })

}

module.exports = {
    handleIncomingSlackData: handleIncomingSlackData,
    sendDataToSlackChannel: sendDataToSlackChannel
};
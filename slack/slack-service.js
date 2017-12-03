var youtubeService = require('../youtube/youtube-service');

function isValidSlackRequest(token) {
    return token === "1avbAdJLErZeZ7VoclM0um2b";
}

function parseYoutubeLinksFromText(str) {
    const regex = /(?:https?:\/\/)(?:www\.)?(?:youtube|youtu)\.(?:be|com)\/[^\s]+/g;
    let m;

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }
}

function handleIncomingSlackData(slack_data) {
    if (isValidSlackRequest(slack_data.token)) {
        parseYoutubeLinksFromText(slack_data.text);
        return 'Success'
    }
    return 'Failure';
}


module.exports = {
    handleIncomingSlackData: handleIncomingSlackData
};
const debug = require('debug')('youtube-service');

const youtubeDownloader = require('ytdl-core');
const songService = require('../songs/songs-service');

const youtubeDownloaderOptions = {
    quality: 'highest',
    filter: 'audioonly'
};

function fetchSong(link) {

    debug('fetching link %s', link);

    return new Promise((resolve, reject) => {
        const isValidUrl = youtubeDownloader.validateURL(link);

        if (!isValidUrl) {
            return reject(new Error('not a valid url'));
        }

        let youtubeVideoStream = youtubeDownloader(link, youtubeDownloaderOptions);
        try {
            youtubeDownloader(link, youtubeDownloaderOptions)
                .on('info', (info, format) => {

                    debug('got info %O', info);
                    debug('got format %O', format);

                    let songId = info.video_id;
                    let fileExtension = format.container;
                    let audioFormat = format.type.split(';')[0];

                    const songToLong = Number(info.length_seconds) > 600;

                    if(songToLong) {
                        return reject('Song is too long.');
                    }

                    let meta = {
                        duration: info.length_seconds,
                        title: info.title,
                        video_url: info.video_url,
                        source: 'youtube',
                        author: info.author.name
                    };

                    debug('metadata being sent %O', meta);

                    resolve({
                        song: youtubeVideoStream,
                        fileExtension: fileExtension,
                        audioFormat: audioFormat,
                        songId: songId,
                        meta: meta
                    });
                })
                .on('error', (err) => {
                    reject(err);
                });
        } catch (err) {
            reject(err);
        }
    });
}

function fetchSongAndAddToStore(link) {
    return fetchSong(link).then(songService.putSong);
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

function getVideoIdFromLink(link) {
    return isValidYoutubeLink(link)
        .then(youtubeDownloader.getURLVideoID);
}

function isValidYoutubeLink(link) {
    const isValid = youtubeDownloader.validateURL(link);

    return isValid ? Promise.resolve(link) : Promise.reject('Not a valid youtube video link');
}


module.exports = {
    fetchSong: fetchSong,
    fetchSongAndAddToStore: fetchSongAndAddToStore,
    parseYoutubeLinksFromText: parseYoutubeLinksFromText,
    getVideoIdFromLink: getVideoIdFromLink,
    isValidYoutubeLink: isValidYoutubeLink
};
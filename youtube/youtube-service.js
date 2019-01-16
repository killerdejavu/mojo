const debug = require('debug')('youtube-service');
const axios = require('axios');
const youtubeDownloader = require('ytdl-core');

const songService = require('../songs/songs-service');
const config = require('../config');
const random = require("../utils/random")();

const youtubeDownloaderOptions = {
    quality: 'highest',
    filter: 'audioonly'
};

const ERROR_MESSAGES = {
    songTooLong: [
        'Sorry! But that song is way too long. #rhymes',
        'Try something less than 10mins, we don\'t want to put people to sleep, do we? :wink:'
    ],
    notAValidYoutubeLink: [
        'There was no video on that link, found a :vhs: instead.',
        'This better not be you, Cheta. :unamused:'
    ]
};

function fetchSong(link) {
    debug('fetching link %s', link);

    return new Promise((resolve, reject) => {
        const isValidUrl = youtubeDownloader.validateURL(link);

        if (!isValidUrl) {
            return reject(new Error('not a valid url'));
        }
        console.log('fetching song!!')
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
                        return reject(random.pick(ERROR_MESSAGES.songTooLong));
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
    return getVideoIdFromLink(link)
        .then(songService.getSong)
        .then((existingSongData) => {
            console.log(existingSongData)
            if (existingSongData && existingSongData.songId) {
                return existingSongData;
            }
            return fetchSong(link).then(songService.putSong);
        })
}

function getVideoIdFromLink(link) {
    return isValidYoutubeLink(link)
        .then(youtubeDownloader.getURLVideoID);
}

function isValidYoutubeLink(link) {
    const isValid = youtubeDownloader.validateURL(link);

    return isValid ? Promise.resolve(link) : Promise.reject(random.pick(ERROR_MESSAGES.notAValidYoutubeLink));
}

function searchSong(query) {
    return axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
            q: query,
            key: config.YOUTUBE_API_KEY,
            part: 'snippet',
            maxResults: 5,
            order: 'viewCount'
        }
    }).then((response) => {
        return response.data.items;
    })
}

module.exports = {
    fetchSong: fetchSong,
    fetchSongAndAddToStore: fetchSongAndAddToStore,
    getVideoIdFromLink: getVideoIdFromLink,
    isValidYoutubeLink: isValidYoutubeLink,
    searchSong: searchSong
};
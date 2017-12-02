const youtubeDownloader = require('ytdl-core');
const songService = require('../songs/songs-service');

const youtubeDownloaderOptions = {
    quality: 'highest',
    filter: 'audioonly'
};

function fetchSong(link) {
    return new Promise((resolve, reject) => {
        let youtubeVideoStream = youtubeDownloader(link, youtubeDownloaderOptions);

        youtubeDownloader(link, youtubeDownloaderOptions)
            .on('info', (info, format) => {
                let songId = info.video_id;
                let fileExtension = format.container;
                let songFormat = format.type.split(';')[0];

                let meta = {
                    duration: info.length_seconds,
                    title: info.title,
                    video_url: info.video_url,
                    source: 'youtube',
                    author: info.author.name
                };

                resolve({
                    song: youtubeVideoStream,
                    fileExtension: fileExtension,
                    songFormat: songFormat,
                    songId: songId,
                    meta: meta
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

function fetchSongAndAddToS3(link) {
    return fetchSong(link).then(songService.putSong);
}

module.exports = {
    fetchSong: fetchSong,
    fetchSongAndAddToS3: fetchSongAndAddToS3
};
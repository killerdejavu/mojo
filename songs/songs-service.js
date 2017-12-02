const musicmetadata = require('musicmetadata');

const s3 = require('../utils/s3');
const config = require('../config');

function getSongStreamFromS3(Key) {
    return s3.getObject({
        Key: Key
    }).createReadStream()
}

function putSong(songData) {
    return new Promise((resolve, reject) => {
        s3.upload({
            Key: config.MUSIC_FOLDER + songData.songId + '.' + songData.fileExtension,
            Body: songData.song,
            ContentType: songData.songFormat,
            ACL: 'public-read'
        }, (err, response) => {
            if(err) return reject(err);
            resolve({
                s3Response: response,
                songData: songData
            });
        });
    });
}

module.exports = {
    putSong: putSong
};
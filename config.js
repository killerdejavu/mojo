const S3_BUCKET = 'mojo-jojo';
const MUSIC_FOLDER = 'music/';
const S3_BUCKET_URL = 'https://s3.ap-south-1.amazonaws.com/' + S3_BUCKET + '/';
const AWS_CRED = {
    accessKeyId: 'AKIAJN64RUOIE7SJCYZA',
    secretAccessKey: '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',
    region: 'us-east-1'
};

const config = {
    S3_BUCKET: S3_BUCKET,
    MUSIC_FOLDER: MUSIC_FOLDER,
    S3_BUCKET_URL: S3_BUCKET_URL,
    AWS_CRED: AWS_CRED
};

module.exports = config;
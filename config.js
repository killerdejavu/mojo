const S3_BUCKET = 'mojo-jojo';
const MUSIC_FOLDER = 'music/';
const S3_BUCKET_URL = 'https://mojo-jojo.s3.amazonaws.com/';
const AWS_CRED = {
    accessKeyId: 'AKIAJN64RUOIE7SJCYZA',
    secretAccessKey: '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',
    region: 'us-east-1'
};
const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://localhost:6379';
const REDIS_KEY_NAMESPACE = 'mojo:';
const REDIS_CURRENT_SONG_KEY = REDIS_KEY_NAMESPACE+'current_song';
const REDIS_SONG_KEY_PREFIX = REDIS_KEY_NAMESPACE+'song:';

const config = {
    S3_BUCKET: S3_BUCKET,
    MUSIC_FOLDER: MUSIC_FOLDER,
    S3_BUCKET_URL: S3_BUCKET_URL,
    AWS_CRED: AWS_CRED,
    REDIS_URL: REDIS_URL,
    REDIS_KEY_NAMESPACE: REDIS_KEY_NAMESPACE,
    REDIS_CURRENT_SONG_KEY: REDIS_CURRENT_SONG_KEY,
    REDIS_SONG_KEY_PREFIX: REDIS_SONG_KEY_PREFIX
};

module.exports = config;
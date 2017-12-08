const S3_BUCKET = 'mojo-jojo';
const MUSIC_FOLDER = 'music/';
const S3_BUCKET_URL = process.env.S3_BUCKET_URL;
const AWS_CRED = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
};
const REDIS_URL = process.env.REDISCLOUD_URL;
const REDIS_KEY_NAMESPACE = 'mojo:';
const REDIS_CURRENT_SONG_KEY = REDIS_KEY_NAMESPACE+'current_song';
const REDIS_SONG_KEY_PREFIX = REDIS_KEY_NAMESPACE+'song:';
const REDIS_RANDOM_LIST_KEY = REDIS_KEY_NAMESPACE+'random_list';
const SLACK_OUTGOING_URL = process.env.SLACK_OUTGOING_URL;
const SLACK_VALID_TOKENS = ["1avbAdJLErZeZ7VoclM0um2b", "7lT991VEoNVG3o0dsTYnBGyG", "9aHAuhSvq7JJiP0iQFq7NyWC", "NSmMHx7CogynU0m5VYiajq5c"];

const config = {
    S3_BUCKET: S3_BUCKET,
    MUSIC_FOLDER: MUSIC_FOLDER,
    S3_BUCKET_URL: S3_BUCKET_URL,
    AWS_CRED: AWS_CRED,
    REDIS_URL: REDIS_URL,
    REDIS_KEY_NAMESPACE: REDIS_KEY_NAMESPACE,
    REDIS_CURRENT_SONG_KEY: REDIS_CURRENT_SONG_KEY,
    REDIS_SONG_KEY_PREFIX: REDIS_SONG_KEY_PREFIX,
    REDIS_RANDOM_LIST_KEY: REDIS_RANDOM_LIST_KEY,
    SLACK_VALID_TOKENS: SLACK_VALID_TOKENS,
    SLACK_OUTGOING_URL: SLACK_OUTGOING_URL
};

module.exports = config;
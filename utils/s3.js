const aws = require('./aws');
const config = require('../config');

const s3 = new aws.S3({
    params: {
        Bucket: config.S3_BUCKET
    }
});

module.exports = s3;
const aws = require('aws-sdk');
const config = require('../config');

aws.config = new aws.Config(config.AWS_CRED);

module.exports = aws;
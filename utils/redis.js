const redis = require('redis');
const config = require('../config');

const redisClient = redis.createClient(config.REDIS_URL, {no_ready_check: true});

module.exports = redisClient;

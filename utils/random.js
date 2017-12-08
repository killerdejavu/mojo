module.exports = function () {
    const Random = require("random-js");
    const random = new Random(Random.engines.mt19937().autoSeed());
    return random;
};
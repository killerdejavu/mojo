const Slapp = require('slapp');

const config = require('../config');

const SLACK_APP_TOKEN = config.SLACK_APP_TOKEN;
const SLACK_BOT_TOKEN = config.SLACK_BOT_TOKEN;
let BOT_USER_ID = null;

const slapp = Slapp({
    context (req, res, next) {
        req.slapp.meta = Object.assign(req.slapp.meta, {
            app_token: SLACK_APP_TOKEN,
            bot_token: SLACK_BOT_TOKEN,
            bot_user_id: BOT_USER_ID
        });
        next();
    },
    ignoreBots: true
});

slapp.client.users.list({token: SLACK_APP_TOKEN}).then((users) => {
    const member = users.members.find((member) => {
        return member.real_name === 'mojo' && member.is_bot;
    });

    BOT_USER_ID = member.id;
});

module.exports = slapp;
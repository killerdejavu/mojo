
function handleIncomingSlackData(slack_req) {
    console.log(slack_req.body);
    return 'Success'
}


module.exports = {
    handleIncomingSlackData: handleIncomingSlackData
};
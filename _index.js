let express = require('express');
let app = express();

let songService = require('./songs/songs-service');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
    response.render('index');
});

app.get('/current', function (request, response) {
    songService.fetchCurrentSong(request.query.next, function (err, res) {
        console.log(res);
        response.send(res);
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

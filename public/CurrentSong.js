var player = document.getElementById('player');
var artistName = document.getElementById('artist');
var songName = document.getElementById('song');

function fetchCurrentSong() {
    axios.get('http://localhost:5000/current')
        .then(function(response) {
            var data = JSON.parse(response.data.body);
            console.log(data);
            player.src = data.url;
            player.currentTime = Math.floor((Date.now() - data.addedOn) / 1000);
            player.play();
            artistName.textContent = data.artist[0];
            songName.textContent = data.title;
        })
}

player.addEventListener('ended', function() {
    if (player.ended) {
        fetchCurrentSong();
    }
});

fetchCurrentSong();

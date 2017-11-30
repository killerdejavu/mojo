var player = document.getElementById('player');
var artistName = document.getElementById('artist');
var songName = document.getElementById('song');

function fetchCurrentSong() {
    axios.get('https://q2af43kaa5.execute-api.ap-south-1.amazonaws.com/prod/mojo')
        .then(function(response) {
            player.src = response.data.url;
            player.currentTime = Math.floor((Date.now() - response.data.addedOn) / 1000);
            player.play();
            artistName.textContent = response.data.artist[0];
            songName.textContent = response.data.title;
        })
}

player.addEventListener('ended', function() {
    if (player.ended) {
        fetchCurrentSong();
    }
});

fetchCurrentSong();

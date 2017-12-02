var player = document.getElementById('player');
var artistName = document.getElementById('artist');
var songName = document.getElementById('song');

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function fetchCurrentSong(seek) {
    var query_value = getParameterByName('next');
    var url = query_value ? '/current?next=true': '/current';
    axios.get(url)
        .then(function(response) {
            var data = response.data;

            artistName.textContent = data.artist[0];
            songName.textContent = data.title;

            var player = new Howl({
                src: [data.s3_url],
                html5: true,
                onend: function() {
                    fetchCurrentSong();
                }
            });

            seek && player.seek(Math.floor((Date.now() - data.start_time) / 1000));
            player.play();
        })
}

fetchCurrentSong(true);

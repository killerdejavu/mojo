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

function fetchCurrentSong() {
    var query_value = getParameterByName('next');
    var url = query_value ? '/current?next=true': '/current';
    axios.get(url)
        .then(function(response) {
            var data = response.data;

            artistName.textContent = data.meta.artist ? data.meta.artist[0] : '';
            songName.textContent = data.meta.title;
            document.title = data.meta.title + ' - Mojo Radio';

            var player = new Howl({
                src: [data.s3Url],
                html5: true,
                onend: function() {
                    fetchCurrentSong();
                }
            });

            player.seek(Math.floor((Date.now() - data.startedPlayingOn) / 1000));
            player.play();
        })
}

fetchCurrentSong();

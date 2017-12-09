var artistName = document.getElementById('artist');
var songName = document.getElementById('song');
var playButton = document.querySelector('.play-btn');
var teamListeningToText = document.querySelector('#team-listening-to-text');
var enableNotification = document.querySelector('#enable-notifications');
var enableNotificationLink = document.querySelector('#enable-notifications a');

var canvas = document.getElementById('equalizer'),
    ctx = canvas.getContext('2d');

var player, currentSongData, playing, fetchNextSongTimer, canvasTimer, source, analyser, canvasWidth, canvasHeight;

var audioContext = new AudioContext();

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    ctx.canvas.width  = canvasWidth;
    ctx.canvas.height = canvasHeight;
}

window.addEventListener('resize', resizeCanvas, false);

document.body.onkeyup = function(e){
    if(e.keyCode == 32){
        togglePlay();
    }

    return false;
};

resizeCanvas();

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function fetchCurrentSong(autoPlay, dontNotify) {
    var query_value = getParameterByName('next');
    var url = query_value ? '/current?next=true' : '/current';
    axios.get(url)
        .then(function (response) {
            currentSongData = response.data;

            artistName.textContent = currentSongData.meta.artist ? currentSongData.meta.artist[0] : currentSongData.meta.video_url;
            songName.textContent = currentSongData.meta.title;
            document.title = currentSongData.meta.title + ' - Mojo Radio';

            if(autoPlay && playing) {
                playSong().then(function() {
                    notify('Now playing - '+currentSongData.meta.title)
                });
            } else {
                setFetchNextSongTimer((currentSongData.startedPlayingOn + currentSongData.meta.duration*1000) - Date.now());
                !dontNotify && notify('Now playing - '+currentSongData.meta.title);
            }
        })
}

function setFetchNextSongTimer(time) {
    fetchNextSongTimer = setTimeout(fetchCurrentSong, time);
}

function clearFetchNextSongTimer() {
    clearTimeout(fetchNextSongTimer);
}

function initMediaPlayer() {
    player = new Audio();
    player.crossOrigin = "anonymous";
    player.src = currentSongData.s3Url;

    player.addEventListener('ended', function() {
        player.ended && fetchCurrentSong(true);
    });

    source = audioContext.createMediaElementSource(player);
    analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.connect(audioContext.destination);

}

function initEqualizer() {

    if(canvasTimer) {
        canvasTimer.stop();
    }

    canvasTimer = d3.timer(function(){
        var freqData = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteFrequencyData(freqData);

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        for (var i = 0; i < freqData.length; i++ ) {
            var magnitude = freqData[i];
            ctx.fillStyle = '#FF5C7C';
            ctx.fillRect(i*3, canvasHeight, 1, -magnitude*2);
        }
    }, 10);
}

function playSong() {
    playing = true;
    initMediaPlayer();
    player.currentTime = (Math.floor((Date.now() - currentSongData.startedPlayingOn) / 1000));
    clearFetchNextSongTimer();
    playButton.disabled = true;
    return player.play().then(function() {
        playButton.disabled = false;
        playButton.classList.remove('pump');
        playButton.classList.remove('play');
        teamListeningToText.classList.add('hide');
        initEqualizer();
    });
}

function stopSong() {
    player.pause();
    playing = false;
    playButton.classList.add('pump');
    playButton.classList.add('play');
    teamListeningToText.classList.remove('hide');
    setFetchNextSongTimer((currentSongData.startedPlayingOn + currentSongData.meta.duration*1000) - Date.now())
}

function togglePlay() {
    playing ? stopSong() : playSong();
}

function notify(msg) {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "granted") {
        var notification = new Notification(msg, {
            silent: true,
            icon: '/favicon-96x96.png'
        });
    }
}

function requestNotification() {
    Notification.requestPermission(function (permission) {
        if (permission === "granted") {
            var notification = new Notification("Shazam!");
        }
    });
    enableNotification.classList.add('hide');
}

if (("Notification" in window) && Notification.permission !== "denied" && Notification.permission !== "granted") {
    enableNotification.classList.remove('hide');

    enableNotificationLink.addEventListener('click', function(e) {
        e.preventDefault();
        requestNotification();
    });
}

fetchCurrentSong(null, true);

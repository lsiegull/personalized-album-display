function displayAll(e) {
  e.preventDefault();
  displaySongs();
}

function openTab(e, tabType) {
  e.preventDefault();
  var tabcontent = document.getElementsByClassName("tabcontent");
  for(var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabType).style.display = "block";
  e.currentTarget.className += " active";
}

Handlebars.registerHelper('arrRep', function(arr) {
  return arr.join("\n");
});

Handlebars.registerHelper('diffArrRep', function(arr) {
  return arr.join("\n\n");
});

var artSource = document.getElementById('art-template').innerHTML,
    artTemplate = Handlebars.compile(artSource),
    artPlaceholder = document.getElementById('album-art');

function compareSongs(entry1, entry2) {
  return entry2[1] - entry1[1];
}
function displaySongs() {
  var formElement = document.querySelector("form");
  var formData = new FormData(formElement)
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(access_token);
  var length = formData.get('length');
  var req1 = spotifyApi.getMyTopTracks({limit: 50, offset: 0, time_range:length});
  var req2 = spotifyApi.getMyTopTracks({limit: 50, offset: 49, time_range:length});
  Promise.all([req1, req2]).then(([res1, res2]) => {
    var data = res1.items.concat(res2.items.slice(1));
    console.log('Top Tracks', data);
    var disWidth = formData.get('display-w');
    var totalTracks = formData.get('total-tracks');
    var totalDisplayAlbums = parseInt(totalTracks, 10);
    var images = processData(data);
    var albumsToDisplay = images.slice(0, totalDisplayAlbums);
    var pWidth = ((1/disWidth)*100 - 1) + "%";
    artPlaceholder.innerHTML = artTemplate({albums:albumsToDisplay});
    var imgs = document.getElementsByClassName("album-img");
    for(var i = 0; i < imgs.length; i++) {
      imgs[i].style.width=pWidth;
      imgs[i].style.maxWidth='100%';
    }
    var albumReps = document.getElementsByClassName("album-rep");
    for(var i = 0; i < albumReps.length; i++) {
      albumReps[i].style.width="33%";
    }
    document.getElementById("defaultOpen").click();
    //var container = document.getElementsByClassName("container");
    //container[0].style.display = "grid";
    //container[0].style.gridTemplateColumns = "1fr 1fr 1fr";
  }).catch(function(err) {console.log(err);})
}
function processData(songs) {
    var songCounts = {};
    var albumArtMap = {};
    for(var i = 0; i < songs.length; i++) {
      var song = songs[i];
      var albumID = song.album.id;
      if(!albumArtMap[albumID]) {
        albumArtMap[albumID] = song.album;
        albumArtMap[albumID].topList = [];
      }
      albumArtMap[albumID].topList.push(song.name);
      if(songCounts[albumID]) {
        songCounts[albumID]++;
      } else {
        songCounts[albumID] = 1;
      }
    }
    var sortedAlbums = Object.entries(songCounts).sort(compareSongs);
    var retAlbumArt = [];
    for(var i = 0; i < sortedAlbums.length; i++) {
      var albumID = sortedAlbums[i][0];
      albumArtMap[albumID].count = sortedAlbums[i][1];
      retAlbumArt.push(albumArtMap[albumID]);
    }
    console.log(retAlbumArt);
    return retAlbumArt;
}
/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
function getHashParams() {
  var hashParams = {};

  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

var userProfileSource = document.getElementById('user-profile-template').innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById('user-profile');

var oauthSource = document.getElementById('oauth-template').innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById('oauth');

var settingsSource = document.getElementById('user-settings-template').innerHTML,
    userSettingsTemplate = Handlebars.compile(settingsSource),
    userSettingsPlaceholder = document.getElementById('user-settings');

var params = getHashParams();

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

if (error) {
  alert('There was an error during the authentication');
} else {
  if (access_token) {
    // render oauth info
    oauthPlaceholder.innerHTML = oauthTemplate({
      access_token: access_token,
      refresh_token: refresh_token
    });
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);
          userSettingsPlaceholder.innerHTML = userSettingsTemplate();
          $('#login').hide();
          $('#loggedin').show();
        }
    });
  } else {
      // render initial screen
      $('#login').show();
      $('#loggedin').hide();
  }

  document.getElementById('obtain-new-token').addEventListener('click', function() {
    $.ajax({
      url: '/refresh_token',
      data: {
        'refresh_token': refresh_token
      }
    }).done(function(data) {
      access_token = data.access_token;
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
      });
    });
  }, false);
}

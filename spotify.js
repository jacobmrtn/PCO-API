let redirect_uri = "http://127.0.0.1:8888/spotify.html"

//Store for later
let playlist_id = ""

const PLAYLISTS = "https://api.spotify.com/v1/me/playlists"
const PLAYLISTS_ID = "https://api.spotify.com/v1//playlists"


function onPageLoad() {
    if (window.location.search.length > 0){
        spotify_handle_access_token_redirect()
    } else {
        let access_token = localStorage.getItem("spotify_access_token")
        if (access_token == null ) {
            console.warn("User probably requested token again. Clear localstorage")
            console.table(localStorage)
        } else if(access_token != null){
            window.location.href = "http://127.0.0.1:8888/app.html"
        }
    }
}

function init_spot_reauth() {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    window.location.href = "http://127.0.0.1:8888/spotify.html"
}
function spotify_get_access_token(spotify_code) {
    fetch('./php/spotify/spotify_call_authorization_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(spotify_code),
    })
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data)
            localStorage.setItem('spotify_access_token', data.access_token)
            localStorage.setItem('spotify_refresh_token', data.refresh_token)
            window.location.href = "http://127.0.0.1:8888/app.html"
        })
        .catch(error => {
            console.error(error)
        })
}

function spotify_handle_access_token_redirect() {
    let spotify_code = spotify_get_code()

    spotify_get_access_token(spotify_code)
    window.history.pushState("", "", redirect_uri)
}

// function refreshAccessToken() {
//     refresh_token = localStorage.getItem('refresh_token')
//     client_id = localStorage.getItem('client_id')
//     let body = "grant_type=refresh_token"
//     body += "&refresh_token=" + localStorage.getItem('refresh_token')
//     body += "&client_id=" + client_id
//     callAuthorizationApi(body)
//     alert('Refreshed Spotify access token')
// }

function spotify_get_code() {
    let code = null
    const queryString = window.location.search
    if(queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    console.log(code)
    localStorage.setItem('spotify_code', code)
    return code
}
function spotify_request_access_token() {
    fetch('./php/spotify/spotify_request_access_token.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            window.location.href = data
        })
        .catch(error => {
            console.error(error)
        })
}

function spotify_refresh_access_token() {
    fetch('./php/spotify/spotify_refresh_access_token.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(localStorage.getItem('spotify_refresh_token'))
    })        
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data)
            localStorage.setItem('spotify_access_token', data.access_token)
            localStorage.setItem('spotify_refresh_token', data.refresh_token)
            if(data.error = "invalid_grant") {
                alert('Reauthorize the Spotify app. Click "Request Spotify token')
            }
        })
        .catch(error => {
            console.error(error)
        })
}

function refresh_spotify_playlists() {
    document.getElementById('spotify_loading_text').innerHTML = "LOADING..."
    spotify_call_api("GET", PLAYLISTS).then ((data) => {
        data = JSON.parse(data)
        remove_all_children("playlists")
        remove_all_children('playlists_to_save')
        
        add_dropdown_header('playlists')
        add_dropdown_header('playlists_to_save')
        data.items.forEach(item => add_spotify_playlist(item, 'playlists'))
        data.items.forEach(item => add_spotify_playlist(item, 'playlists_to_save'))
        loading_text('spotify_loading_text', 'DONE!', 1000)
    }).catch(error => {
        console.error(error)
    })
}

function spotify_refresh_playlist_tracks() {
    playlist_id = document.getElementById('playlists').value
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=next%2Citems%28track%28name%2C+id%29%29%2Ctotal`).then ((data) => {
        data = JSON.parse(data)
        if(data.total > 100) {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index))
            let trackTotal = Math.floor(data.total/100) + 1
            for(let offset = 1; offset < trackTotal; offset ++) {
                spotify_handle_playlist_track_response_over_100(offset)
            }
        } else {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index))
        }
    }).catch(error => {
        console.error(error)
    })
}


// parse response 
// check if tracks is over 100
// if so then use different function to call the api 
// append first response to the spotify list
// call again then append the second response 
// repeat 
function testResponse() {
    if ( this.status == 200 ){
        let data = JSON.parse(this.responseText)
        // console.log(data)
        if(data.total > 100) {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index))
            let trackTotal = Math.floor(data.total/100) + 1
            for(let offset = 1; offset < trackTotal; offset ++) {
                spotify_handle_playlist_track_response_over_100(offset)
            }
        } else {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index))
        }
    } else if ( this.status == 401 ){
        refreshAccessToken()
    } else {
        console.log(this.responseText)
        alert(this.responseText)
    }   
}

// Call the api
function spotify_handle_playlist_track_response_over_100(offset) {
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items%28track%28name%2Cid%29%29&offset=${offset * 100}`).then ((data) => {
        data = JSON.parse(data)
        data.items.forEach((item, index) => add_spotify_track(item, index))
    }).catch(error => {
        console.error(error)
    })
}


function handle_spotify_playlist_track_response() {
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText)
        console.log(data)
        remove_all_children('spotify_song_list')
        data.items.forEach( (item, index) => add_spotify_track(item, index))
    } else if ( this.status == 401 ){
        refreshAccessToken()
    } else {
        console.log(this.responseText)
        alert(this.responseText)
    }
}

function add_dropdown_header(id) {
    let select_node = document.createElement("option")

    select_node.innerHTML = "Select playlist --"

    document.getElementById(id).appendChild(select_node)
}

function add_spotify_playlist(item, id){
    let node = document.createElement("option")

    node.value = item.id
    node.innerHTML = item.name + " (" + item.tracks.total + ")"

    document.getElementById(id).appendChild(node)
}

function add_spotify_track(item, index) {
    let node = document.createElement("p")
    node.value = index
    node.innerHTML = item.track.name
    node.id = item.track.id
    // node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")"
    document.getElementById("spotify_song_list").appendChild(node)
}

async function spotify_call_api(method, url) {
    const spotify_access_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        "method": method
    })
    const response = await fetch('./php/spotify/spotify_call_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: spotify_access_info
    })

    return response.json()
}

function remove_all_children( elementId){
    let node = document.getElementById(elementId)
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}

function loading_text(id, text, timeout) {
    document.getElementById(id).innerHTML = text
    setTimeout(() => {
        document.getElementById(id).innerHTML = ""
    }, timeout)
}

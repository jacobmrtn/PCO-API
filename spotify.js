let redirect_uri = "http://127.0.0.1:8888/app.html"

let client_id = ""
let client_secret = ""

//Store for later
let playlist_id = ""

const AUTHORIZE = 'https://accounts.spotify.com/authorize'
const TOKEN = 'https://accounts.spotify.com/api/token'
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists"
const PLAYLISTS_ID = "https://api.spotify.com/v1//playlists"
const DEVICES = "https://api.spotify.com/v1/me/player/devices"

function onPageLoad() {
    client_id = localStorage.getItem("client_id")
    client_secret = localStorage.getItem("client_secret")

    if (window.location.search.length > 0){
        handleRedirect()
    } else {
        let access_token = localStorage.getItem("access_token")
        if (access_token == null ) {
            console.log('fix this please!!!')
        } else {
            window.location.href = "http://127.0.0.1:8888/app.html"
        }
    }
}

function re_auth_spot() {
    localStorage.removeItem('client_id')
    localStorage.removeItem('client_secret')
    localStorage.removeItem('access_token')
    window.location.href ='http://127.0.0.1:8888/spotify.html'
}

function handleRedirect() {
    let code =spotify_get_code()
    fetchAccessToken(code)
    window.history.pushState("", "", redirect_uri) 
}

function callAuthorizationApi(body){
    client_id = localStorage.getItem('client_id')
    client_secret = localStorage.getItem('client_secret')
    let xhr = new XMLHttpRequest()
    xhr.open("POST", TOKEN, true)
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(localStorage.getItem('client_id')+ ":" + client_secret))
    xhr.send(body)
    xhr.onload = handleAuthorizationResponse
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem('refresh_token')
    client_id = localStorage.getItem('client_id')
    let body = "grant_type=refresh_token"
    body += "&refresh_token=" + localStorage.getItem('refresh_token')
    body += "&client_id=" + client_id
    callAuthorizationApi(body)
    alert('Refreshed Spotify access token')
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code"
    body += "&code=" + code 
    body += "&redirect_uri=" + encodeURI(redirect_uri)
    body += "&client_id=" + client_id
    body += "&client_secret=" + client_secret
    console.log(body)
    callAuthorizationApi(body)
}

function handleAuthorizationResponse() {
    if(this.status == 200) {
        var data = JSON.parse(this.responseText)
        console.log(data)
        var data = JSON.parse(this.responseText)
        if(data.access_token != undefined) {
            access_token = data.access_token
            localStorage.setItem("access_token", access_token)
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token
            localStorage.setItem("refresh_token",  refresh_token)
        }
        onPageLoad()
    } else {
        console.log(this.responseText)
        if(this.responseText.includes('Invalid refresh token')) {
            alert('Error: Try reloading the page.')
        }
    }
}

function spotify_get_code() {
    let code = null
    const queryString = window.location.search
    if(queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    return code
}

function requestAuthorization()  {
    client_id = document.getElementById('client_id').value
    client_secret = document.getElementById('client_secret').value

    localStorage.setItem('client_id', client_id)
    localStorage.setItem('client_secret', client_secret)

    let url = AUTHORIZE
    url += "?client_id=" + client_id
    url += "&response_type=code"
    url += "&redirect_uri=" + encodeURI(redirect_uri)
    url += "&show_dialog=true"
    url += "&scope=playlist-modify-public playlist-modify-private user-read-playback-state ugc-image-upload user-modify-playback-state user-read-currently-playing app-remote-control streaming playlist-read-private playlist-read-collaborative user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read"
    window.location.href = url
}

function refresh_spotify_playlists() {
    spotify_call_api("GET", PLAYLISTS, null, handle_spotify_playlist_response)
}

function refresh_spotify_playlist_tracks() {
    playlist_id = document.getElementById('playlists').value
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=next%2Citems%28track%28name%2C+id%29%29%2Ctotal`, null, testResponse)
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
                handle_spotify_playlist_track_response_100(offset)
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
function handle_spotify_playlist_track_response_100(offset) {
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items%28track%28name%2Cid%29%29&offset=${offset * 100}`, null, handle_spotify_playlist_track_response_2)
}

function handle_spotify_playlist_track_response_2() {
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText)
        //console.log(data.items)
        data.items.forEach((item, index) => add_spotify_track(item, index))
    } else if ( this.status == 401 ){
        refreshAccessToken()
    } else {
        console.log(this.responseText)
        alert(this.responseText)
    }
}

function handle_spotify_playlist_response(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText)
        //console.log(data)
        remove_all_children("playlists")
        data.items.forEach(item => add_spotify_playlist(item))
    } else if ( this.status == 401 ){
        refreshAccessToken()
    } else {
        console.log(this.responseText)
        alert(this.responseText)
    }
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

function add_spotify_playlist(item){
    let node = document.createElement("option")
    node.value = item.id
    node.innerHTML = item.name + " (" + item.tracks.total + ")"
    document.getElementById("playlists").appendChild(node)
}

function add_spotify_track(item, index) {
    let node = document.createElement("p")
    node.value = index
    node.innerHTML = item.track.name
    node.id = item.track.id
    // node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")"
    document.getElementById("spotify_song_list").appendChild(node)
}

function spotify_call_api(method, url, body, callback){
    let xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('access_token'))
    xhr.send(body)
    xhr.onload = callback
}

function remove_all_children( elementId){
    let node = document.getElementById(elementId)
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}

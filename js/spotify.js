import { loading_text, remove_all_children, spotify_call_api } from './functions.js';
//Store for later
let playlist_id = ""

const PLAYLISTS = "https://api.spotify.com/v1/me/playlists"
const PLAYLISTS_LINK = "https://api.spotify.com/v1//playlists"

document.addEventListener('DOMContentLoaded', (e)=> {
    document.getElementById('request_spotify_token').addEventListener('click', init_spot_reauth)
    document.getElementById('spotify_refresh_playlist_tracks').addEventListener('click', refresh_spotify_playlists)
    document.getElementById('playlists').addEventListener('change', spotify_refresh_playlist_tracks)
})

function init_spot_reauth() {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    window.location.href = "http://127.0.0.1:8888/spotify.html"
}

function refresh_spotify_playlists() {
    document.getElementById('spotify_loading_text').classList.remove('error-text')
    document.getElementById('spotify_loading_text').innerHTML = "LOADING..."
    spotify_call_api("GET", PLAYLISTS).then ((data) => {
        data = JSON.parse(data)
        if(data === 401) {
            loading_text('spotify_loading_text', 'Access token expired - Requst a new one', null, 'error')
        } else {
            remove_all_children("playlists")
            
            add_dropdown_header('playlists')
            data.items.forEach(item => add_spotify_playlist(item, 'playlists'))
            loading_text('spotify_loading_text', 'SUCCESS!', 5000, 'success')
        }

    }).catch(error => {
        console.error(error)
    })
    spotify_get_user()
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

// Handles playlists with over 100 songs
function spotify_handle_playlist_track_response_over_100(offset) {
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items%28track%28name%2Cid%29%29&offset=${offset * 100}`).then ((data) => {
        data = JSON.parse(data)
        data.items.forEach((item, index) => add_spotify_track(item, index))
    }).catch(error => {
        console.error(error)
    })
}

function spotify_get_user() {
    spotify_call_api("GET", "https://api.spotify.com/v1/me").then((data) => {
    data = JSON.parse(data)
    localStorage.setItem('spotify_user_id', data.id)
    }).catch(error => {
        console.log(error)
    })
}

function add_dropdown_header(id) {
    let select_node = document.createElement("option")
    select_node.innerHTML = "Select playlist --"
    select_node.setAttribute('class', 'dropdown-header')
    document.getElementById(id).appendChild(select_node)
}

function add_spotify_playlist(item, id){
    let node = document.createElement("option")
    node.value = item.id
    node.innerHTML = item.name + " (" + item.tracks.total + ")"
    node.setAttribute('class', 'dropdown-item')
    node.setAttribute('data-snapshot-id', item.snapshot_id)
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
import { loading_text, remove_all_children, spotify_call_api, spotify_refresh_access_token, add_dropdown_header } from './functions.js';
//Store for later
let refreshed_playlist = false

const PLAYLISTS = "https://api.spotify.com/v1/me/playlists?limit=50"

document.addEventListener('DOMContentLoaded', ()=> {
    document.getElementById('request_spotify_token').addEventListener('click', init_spot_reauth)
    document.getElementById('spotify_refresh_playlist_tracks').addEventListener('click', refresh_spotify_playlists)
    document.getElementById('playlists').addEventListener('change', spotify_refresh_playlist_tracks)
    document.getElementById('spotify_custom_save_location').addEventListener('change', spotify_select_custom_save_location)
    document.getElementById('pre_made_playlist_check').addEventListener('click', display_custom_save_location)
})

function init_spot_reauth() {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_user_id')
    window.location.href = ("https://192.168.200.143/spotify.html")
}

function refresh_spotify_playlists(use_dropdown_header, refresh_loading_text) {
    if(localStorage.getItem('spotify_access_token') == null) {
        loading_text('spotify_loading_text', 'Please request Spotify token!', null, 'error')
    } else {
        document.getElementById('spotify_loading_text').classList.remove('error-text')
        document.getElementById('spotify_loading_text').classList.remove('success-text')
        document.getElementById('spotify_loading_text').classList.remove('refresh-text')
        document.getElementById('spotify_loading_text').innerHTML = "LOADING..."
        spotify_call_api("GET", PLAYLISTS).then ((data) => {
            data = JSON.parse(data)
            if(data === 401) {
                spotify_refresh_access_token(handle_spotify_playlist_response)
                loading_text('spotify_loading_text', 'Access token expired - Requst a new one', null, 'error')
            } else {
                refreshed_playlist = true
                handle_spotify_playlist_response(data, use_dropdown_header, refresh_loading_text)
            }


        }).catch(error => {
            console.error(error)
        })
        spotify_get_user()
    }
}

function handle_spotify_playlist_response(data, use_dropdown_header, refresh_loading_text) {
    document.querySelector('.custom-save-location').style.display = "block"
    if(data.items.length === 50) {
        remove_all_children("playlists")
        remove_all_children("spotify_custom_save_location")
        if(use_dropdown_header) add_dropdown_header('playlists', 'Select playlist --'), add_dropdown_header('spotify_custom_save_location', 'Select playlist --');
        data.items.forEach(item => add_spotify_playlist(item, 'playlists'))
        data.items.forEach(item => add_spotify_playlist(item, 'spotify_custom_save_location'))
        spotify_handle_playlist_response_over_50(data.next)
        check_refreshed(refresh_loading_text)
    } else {
        remove_all_children("playlists")
        remove_all_children("spotify_custom_save_location")
        if(use_dropdown_header) add_dropdown_header('playlists', 'Select playlist --'), add_dropdown_header('spotify_custom_save_location', 'Select playlist --');
        data.items.forEach(item => add_spotify_playlist(item, 'playlists'))
        data.items.forEach(item => add_spotify_playlist(item, 'spotify_custom_save_location'))
        check_refreshed(refresh_loading_text)
    }
}

function spotify_select_custom_save_location(){
    let playlists = document.getElementById('spotify_custom_save_location')
    let playlist_id = playlists.value

    localStorage.setItem('custom_save_location_spotify_playlist_id', playlist_id)
    let selected_playlist = playlists.options[playlists.selectedIndex]
    let playlist_name = selected_playlist.getAttribute('data-playlist-name')
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=next%2Citems%28track%28name%2C+id%2C+uri%29%29%2Ctotal`).then ((data) => {
        data = JSON.parse(data)
        document.getElementById("custom_save_location_spotify_songs_title").innerText = playlist_name
        if(data.total > 100) {
            remove_all_children("custom_save_location_song_list")
            data.items.forEach((item, index) => add_spotify_track(item, index, "custom_save_location_song_list"))
            let trackTotal = Math.floor(data.total / 100) + 1
            for(let offset = 1; offset < trackTotal; offset++) {
                spotify_handle_playlist_track_response_over_100(offset, playlist_id, "custom_save_location_song_list")
            }
        } else {
            remove_all_children("custom_save_location_song_list")
            data.items.forEach((item, index) => add_spotify_track(item, index, "custom_save_location_song_list"))
        }
    })

}

function spotify_refresh_playlist_tracks() {
    let playlists = document.getElementById('playlists')
    let playlist_id = playlists.value
    localStorage.setItem('spotify_playlist_id', playlist_id)
    let selected_playlist = playlists.options[playlists.selectedIndex]
    let playlist_name = selected_playlist.getAttribute('data-playlist-name')
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=next%2Citems%28track%28name%2C+id%2C+uri%29%29%2Ctotal`).then ((data) => {
        data = JSON.parse(data)
        document.getElementById('spotify_songs_title').innerText = playlist_name
        if(data.total > 100) {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index, "spotify_song_list"))
            let trackTotal = Math.floor(data.total / 100) + 1
            for(let offset = 1; offset < trackTotal; offset ++) {
                spotify_handle_playlist_track_response_over_100(offset, playlist_id, "spotify_song_list")
            }
        } else {
            remove_all_children('spotify_song_list')
            data.items.forEach( (item, index) => add_spotify_track(item, index, "spotify_song_list"))
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

// Handles playlists with over 100 songs
function spotify_handle_playlist_track_response_over_100(offset, playlist_id, elementId) {
    spotify_call_api("GET", `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=next%2Citems%28track%28name%2C+id%2C+uri%29%29&offset=${offset * 100}`).then ((data) => {
        data = JSON.parse(data)
        data.items.forEach((item, index) => add_spotify_track(item, index, elementId))
    }).catch(error => {
        console.error(error)
    })
}

// Handles user lib with over 50 playlists
// Calls API then checks if response has a data.next value 
function spotify_handle_playlist_response_over_50(url) {
    spotify_call_api("GET", url).then ((data) => {
        data = JSON.parse(data)
        data.items.forEach(item => add_spotify_playlist(item, 'playlists'))
        if(data.next) {
            spotify_handle_playlist_response_over_50(data.next)
        }
    }).catch(error => {
        console.error(error)
    })
}

function spotify_get_user() {
    spotify_call_api("GET", "https://api.spotify.com/v1/me").then((data) => {
    data = JSON.parse(data)
    localStorage.setItem('spotify_user_id', data.id)
    }).catch(error => {
        console.error(error)
    })
}

function check_refreshed(refresh_loading_text) {
    if(refresh_loading_text) {
        loading_text('spotify_loading_text', 'REFRESHED!', 5000, 'refresh')
    } else {
        loading_text('spotify_loading_text', 'SUCCESS!', 5000, 'success')
    }
}

function add_spotify_playlist(item, id){
    let node = document.createElement("option")
    node.value = item.id
    node.innerHTML = item.name + " (" + item.tracks.total + ")"
    node.setAttribute('class', 'dropdown-item')
    node.setAttribute('data-snapshot-id', item.snapshot_id)
    node.setAttribute('data-playlist-name', item.name)
    document.getElementById(id).appendChild(node)
}

function add_spotify_track(item, index, elementId) {
    let node = document.createElement("p")
    node.value = index 
    node.setAttribute('data-song-uri', item.track.uri)  
    node.innerHTML = item.track.name
    node.id = item.track.id
    document.getElementById(elementId).appendChild(node)
}

function display_custom_save_location() {
    let use_custom_save_location = document.getElementById("pre_made_playlist_check").checked
    if(use_custom_save_location == true) {
        document.querySelector('.select-save-location').style.display = "block"
        document.querySelector("#spotify_settings_option_2").style.display = "block"
    } else {
        document.querySelector("#spotify_settings_option_2").style.display = "none"
        document.querySelector('.select-save-location').style.display = "none"
    }

}

export {refresh_spotify_playlists}

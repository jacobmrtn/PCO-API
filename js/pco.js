import { loading_text } from "./functions.js"

const pco_authorize_link = 'https://api.planningcenteronline.com/oauth/authorize'
const pco_token_link = 'https://api.planningcenteronline.com/oauth/token'
const pco_client_id = '436b59ef4349b87ade668b83f3a9b4b4f7dd6719e6c12789ff235b584cb90819'
const pco_uri = 'http://127.0.0.1:8888/app.html'
const scope = 'services'


// Save for later
let spotify_playlist_id = ""
let spotify_playlist_snapshot_id = ""

document.addEventListener('DOMContentLoaded', () => {
    pco_on_page_load()
    document.getElementById('request_pco_token').addEventListener('click', pco_init_oauth)
    document.getElementById('pco_load_services').addEventListener('click', pco_load_services)
    document.getElementById('plans').addEventListener('change', pco_get_songs)
    document.getElementById('compare_both_list').addEventListener('click', compare_lists)
})

window.addEventListener('load', pco_on_page_load())

function pco_on_page_load() {
    if (window.location.search.length > 0){
        pco_handle_redirect()
    } 
}

function pco_handle_redirect() {
    pco_get_code()
    pco_request_access_token()
    window.history.pushState("", "", pco_uri)
}

function pco_init_oauth() {
    // fetch('pco_init_oauth.php', {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // })
    window.location.href =`https://api.planningcenteronline.com/oauth/authorize?client_id=${pco_client_id}&redirect_uri=${pco_uri}&response_type=code&scope=${scope}`
}

function pco_get_code() {
    let code = null
    const queryString = window.location.search
    if(queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    localStorage.setItem('pco_code', code)
    return code
}

function pco_request_access_token() {
    fetch('./php/pco/pco_request_access_token.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify(localStorage.getItem('pco_code')),
    }) 
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('pco_access_token', data.access_token) 
            localStorage.setItem('pco_refresh_token', data.refresh_token)
        })
        .catch(error => {
            console.log("Error:", error)
        })
}

// function used to call PCO Api
async function pco_call_api(url) {
    const pco_access_info = JSON.stringify({
        "pco_access_token": localStorage.getItem('pco_access_token'),
        "url": url
    })
    const response = await fetch('./php/pco/pco_call_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: pco_access_info
    })
    
    return response.json() //return response from the API
}

function populate_plan_dropdown(parsed_data) {
    document.getElementById('refresh_plans').innerHTML = 'Select plans --'
    for(let i = 0; i < parsed_data.data.length; i++) {
        add_plan_title(parsed_data, i)
    }
}

function add_plan_title(data, index) {
    let node = document.createElement('option')
    node.value = data.data[index].links.self
    node.innerHTML = data.data[index].attributes.dates + data.data[index].attributes.title
    if(data.data[index].attributes.title == null) {
        node.innerHTML = data.data[index].attributes.dates
    } else {
        node.innerHTML = data.data[index].attributes.dates + " - " + data.data[index].attributes.title
    }
    document.getElementById('plans').appendChild(node)
}

function add_plan_item(pco_response, index) {
    let node = document.createElement('p')
    node.innerHTML = pco_response.data[index].attributes.title
    document.getElementById('pco_song_list').appendChild(node)
}

function pco_load_services() {
    document.getElementById('pco_loading_text').classList.remove('error-text')
    document.getElementById('pco_loading_text').innerHTML = "LOADING..."
    pco_call_api("https://api.planningcenteronline.com/services/v2/service_types/50209/plans?order=-created_at").then ((data) => {
        data = JSON.parse(data)
        if(data === 401) {
            loading_text('pco_loading_text', 'Access token expired - Requst a new one!', null, 'error')
        } else {
            populate_plan_dropdown(data)
            loading_text('pco_loading_text', 'SUCCESS!', 5000, 'success')
            
        }
    })
}

function pco_get_songs() {
    let apiLink = document.getElementById('plans').value + '/items'
    pco_call_api(apiLink).then ((pco_response) => {
        pco_response = JSON.parse(pco_response)
        remove_all_children('pco_song_list')
        for(let i = 0; i < pco_response.data.length; i++) {
            if(pco_response.data[i].attributes.item_type === 'song') {
                add_plan_item(pco_response, i)
            }
        }
    })
}

function remove_all_children(element) {
    let node = document.getElementById(element)
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}

function compare_lists() {
    let pco_song_list = Array.from(document.getElementById('pco_song_list').children)
    let spotify_song_list = Array.from(document.getElementById('spotify_song_list').children)

    let match_list = []
    let song_list = []


    for(let spotify_item = 0; spotify_item < spotify_song_list.length; spotify_item++) {
        let spotify_song = spotify_song_list[spotify_item].innerHTML.trim().toLowerCase()
        for(let pco_item = 0; pco_item < pco_song_list.length; pco_item++) {
            let pco_song = pco_song_list[pco_item].innerHTML.trim().toLowerCase()
            if(spotify_song.includes(pco_song)) {
                console.log(spotify_song)
                match_list.push(`spotify:track:${spotify_song_list[spotify_item].id}`)
                song_list.push(spotify_song_list[spotify_item].id)
            }
        }
    }

    spotify_playlist_snapshot_id = spotify_get_playlist_snapshot_id()
    spotify_playlist_id = spotify_get_playlist_id()
    let spotify_new_playlist_info = spotify_create_new_playlist_info()
    let spotify_playlist_data = create_spotify_delete_data(match_list, spotify_playlist_snapshot_id)

    spotify_create_playlist(`https://api.spotify.com/v1/users/${localStorage.getItem('spotify_user_id')}/playlists`, JSON.parse(spotify_new_playlist_info)).then ((data) => {
        console.log(data)
    }).catch(error => {
        console.log(error)
    })
    
    spotify_check_playlist(`https://api.spotify.com/v1/me/playlists`, "GET").then((data) => {
        data = JSON.parse(data)
        data.items.forEach((item, index) => test_1(item, index))
    })

    spotify_call_delete_api(`'DELETE', https://api.spotify.com/v1/playlists/${spotify_playlist_id}/tracks`, JSON.parse(spotify_playlist_data)).then ((data) => {
        console.log(data)
    }).catch(error => {
        console.log(error)
    })
}

function create_spotify_delete_data(uris, snapsoht_id) {
    let post_data = {
        tracks: [],
        snapshot_id: ""
    }

    for (let i = 0; i < uris.length; i++) {
        post_data.tracks.push({ uri: `${uris[i]}` });
    }
    post_data.snapshot_id = `${snapsoht_id}`
    return JSON.stringify(post_data, null, 2)
}

function spotify_get_playlist_snapshot_id() { 
    let playlists = document.getElementById('playlists')
    let selected_playlist = playlists.options[playlists.selectedIndex]
    return spotify_playlist_snapshot_id = selected_playlist.getAttribute('data-snapshot-id')
}

function spotify_get_playlist_id() {
    return spotify_playlist_id = document.getElementById('playlists').value
}

function spotify_create_new_playlist_info() {

    let current_day = new Date()
    let month = current_day.getMonth()
    let day = current_day.getDate()
    let year = current_day.getFullYear()

    let full_data = `${month}/${day}/${year}`

    console.log(full_data)
    let post_data = {
        name: `Removed Songs - ${full_data}`,
        description: "These songs were removed using the PCO X Spotify app (v0.9)",
        public: false
    }
    return JSON.stringify(post_data, null, 2)
}

function test_1(item, index) {

    console.log(item.id, item)
}

async function spotify_create_playlist(url, request_body) {
    const request_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        "request_body": request_body 
    })
    const response = await fetch('./php/spotify/spotify_call_user_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: request_info
    })
    return response.json()
}


async function spotify_check_playlist(url, method) {
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

async function spotify_call_delete_api(method, url, delete_data) {
    const spotify_access_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        "method": method,
        "playlist_data": delete_data
    })
    const response = await fetch('./php/spotify/spotify_call_delete_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: spotify_access_info
    })
    return response.json()
}

function pco_page_redirect_ccli() {
    window.location.href = "http://127.0.0.1:8888/ccli.html"
}
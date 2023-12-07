import { loading_text, remove_all_children, pco_refresh_access_token} from "./functions.js"
import { refresh_spotify_playlists } from "./spotify.js"

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('request_pco_token').addEventListener('click', init_pco_reauth)
    document.getElementById('pco_load_services').addEventListener('click', pco_load_services)
    document.getElementById('plans').addEventListener('change', pco_get_songs)
    document.getElementById('compare_both_list').addEventListener('click', compare_lists)
})

function init_pco_reauth() {
    localStorage.removeItem('pco_access_token')

    window.location.href = ("http://127.0.0.1:8888/pco_init.html")
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
    let plan_title = data.data[index].attributes.title
    let plan_date = data.data[index].attributes.dates

    node.value = data.data[index].links.self
    node.innerHTML = plan_date + plan_title
    
    if(plan_title == null) {
        node.setAttribute('data-plan-date', plan_date)
        node.innerHTML = plan_date
    } else {
        node.setAttribute('data-plan-date', plan_date)
        node.setAttribute('data-plan-title', plan_title)
        node.innerHTML = plan_date + " - " + plan_title
    }
    document.getElementById('plans').appendChild(node)
}

function add_plan_item(pco_response, index, has_song) {
    if(has_song) {
        let node = document.createElement('p')
        node.innerHTML = pco_response.data[index].attributes.title
        document.getElementById('pco_song_list').appendChild(node)
    } else {
        let node = document.createElement('p')
        node.innerHTML = "No songs in selected plan."
        document.getElementById('pco_song_list').appendChild(node)
    }
}

function pco_load_services() {
    document.getElementById('pco_loading_text').classList.remove('error-text')
    document.getElementById('pco_loading_text').innerHTML = "LOADING..."
    pco_call_api("https://api.planningcenteronline.com/services/v2/service_types/50209/plans?order=sort_data&filter=future").then ((data) => {
        data = JSON.parse(data)
        if(data === 401) {
            pco_refresh_access_token()
            loading_text('pco_loading_text', 'Access token expired - Requst a new one!', null, 'error')
        } else {
            populate_plan_dropdown(data)
            loading_text('pco_loading_text', 'SUCCESS!', 5000, 'success')
            
        }
    })
}

function pco_get_songs() {
    let plans = document.getElementById('plans')
    let apiLink = plans.value + '/items'
    let selected_plan = plans.options[plans.selectedIndex]
    let plan_title = selected_plan.getAttribute('data-plan-title')
    let plan_date = selected_plan.getAttribute('data-plan-date')

    let pco_songs_title = document.getElementById('pco_songs_title')
    let pco_song_list = []

    if(plan_title == null) {
        pco_songs_title.innerHTML = plan_date
    } else {
        pco_songs_title.innerHTML = `${plan_date} - ${plan_title}`
    }

    pco_call_api(apiLink).then ((pco_response) => {
        pco_response = JSON.parse(pco_response)
        if(pco_response === 401) {  
            loading_text('pco_loading_text', 'Access token expired - Requst a new one!', null, 'error')
        } else {
            remove_all_children('pco_song_list')
            for(let i = 0; i < pco_response.data.length; i++) {
                if(pco_response.data[i].attributes.item_type == 'song') {
                    pco_song_list.push(pco_response.data[i].attributes.title)
                }
            }
    
            if(pco_song_list.length == 0) {
                add_plan_item(null, null, false)
            } else {
                for(let i = 0; i < pco_response.data.length; i++) {
                    if(pco_response.data[i].attributes.item_type === 'song') {
                        add_plan_item(pco_response, i, true)
                    }
                }
            }
        }
        
    })
}

function compare_lists() {
    let pco_song_list = Array.from(document.getElementById('pco_song_list').children)
    let spotify_song_list = Array.from(document.getElementById('spotify_song_list').children)

    let delete_list = []
    let song_list = []
    let populate_list = []

    for(let spotify_item = 0; spotify_item < spotify_song_list.length; spotify_item++) {
        let spotify_song = spotify_song_list[spotify_item].innerHTML.trim().toLowerCase()
        for(let pco_item = 0; pco_item < pco_song_list.length; pco_item++) {
            let pco_song = pco_song_list[pco_item].innerHTML.trim().toLowerCase()
            if(spotify_song.includes(pco_song)) {
                populate_list.push(spotify_song_list[spotify_item].getAttribute('data-song-uri'))
                delete_list.push(`spotify:track:${spotify_song_list[spotify_item].id}`)
                song_list.push(spotify_song_list[spotify_item].id)
            }
        }
    }

    let spotify_playlist_snapshot_id = spotify_selected_playlist_snapshot_id() 
    let spotify_selected_playlist_id = spotify_get_selected_playlist_id()
    let spotify_playlist_info = spotify_new_playlist_info()
    let spotify_playlist_delete_data = create_spotify_delete_data(delete_list, spotify_playlist_snapshot_id)
    let populate_spotify_playlist_data = create_spotify_playlist_data(populate_list)
    let spotify_playlist_to_populate

    if(delete_list != 0) {
        spotify_create_playlist(`https://api.spotify.com/v1/users/${localStorage.getItem('spotify_user_id')}/playlists`, JSON.parse(spotify_playlist_info)).then ((data) => {
            data = JSON.parse(data)
            spotify_playlist_to_populate = data.id
            spotify_populate_playlist(`https://api.spotify.com/v1/playlists/${spotify_playlist_to_populate}/tracks`, JSON.parse(populate_spotify_playlist_data)).then (() => {
                refresh_spotify_playlists(false, true)
            }).catch(error => {
                console.error(error)
            })
    
        }).catch(error => {
            console.error(error)
        })
    
        spotify_check_playlist(`https://api.spotify.com/v1/me/playlists`, "GET").catch(error => (console.error(error)))
        spotify_call_delete_api(`https://api.spotify.com/v1/playlists/${spotify_selected_playlist_id}/tracks`, JSON.parse(spotify_playlist_delete_data)).catch(error => (console.error(error)))
        alert(`Matches found! Successfully removed ${song_list.length} song(s), ${localStorage.getItem('spotify_playlist_id')}`)
    } else {
        alert("No matches found!")
    }
}

function create_spotify_playlist_data(uris) {
    let post_data = {
        uris: [],
        position: 0
    }

    for(let i = 0; i < uris.length; i++) {
        post_data.uris.push(`${uris[i]}`)
    } 
    return JSON.stringify(post_data, null, 2)
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

function spotify_selected_playlist_snapshot_id() { 
    let playlists = document.getElementById('playlists')
    let selected_playlist = playlists.options[playlists.selectedIndex]
    return selected_playlist.getAttribute('data-snapshot-id')
}

function spotify_get_selected_playlist_id() {
    return document.getElementById('playlists').value
}

function spotify_new_playlist_info() {
    let current_day = new Date()
    let month = current_day.getMonth()
    let day = current_day.getDate()
    let year = current_day.getFullYear()

    let full_data = `${month}/${day}/${year}`

    let post_data = {
        name: `Removed Songs - ${full_data} | ${localStorage.getItem('spotify_playlist_id')}`,
        description: "These songs were removed using the PCO X Spotify app (v0.9)",
        public: false
    }
    return JSON.stringify(post_data, null, 2)
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

async function spotify_populate_playlist(url, request_body) {
    const request_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        "playlist_data": request_body
    })
    const response = await fetch('./php/spotify/spotify_call_create_playlist_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: request_info
    }) 

    if(response.ok) {
        return response.json()
    } else {
        throw new Error('Network response was not ok.')
    }

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

async function spotify_call_delete_api(url, delete_data) {
    const request_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        "request_body": delete_data
    })
    const response = await fetch('./php/spotify/spotify_call_delete_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: request_info
    })
    return response.json()
}

function pco_page_redirect_ccli() {
    window.location.href = "http://127.0.0.1:8888/ccli.html"
}

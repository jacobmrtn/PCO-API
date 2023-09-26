const pco_authorize_link = 'https://api.planningcenteronline.com/oauth/authorize'
const pco_token_link = 'https://api.planningcenteronline.com/oauth/token'
//const pco_client_id = ''
const pco_uri = 'http://127.0.0.1:8888/app.html'
const scope = 'services'


// Save for later
let spotify_playlist_id = ""
let spotify_playlist_snapshot_id = ""

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

document.getElementById('request_api').addEventListener('click', pco_init_oauth)
document.getElementById('pco_load_services').addEventListener('click', pco_load_services)

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
            console.log(data)
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
    document.getElementById('pco_loading_text').innerHTML = "LOADING..."
    // Load data from PCO and wait & Then use that data to populate the dropdown
    pco_call_api("https://api.planningcenteronline.com/services/v2/service_types/50209/plans?order=-created_at").then ((data) => {
        data = JSON.parse(data)
        populate_plan_dropdown(data)
        loading_text('pco_loading_text', 'DONE!', 1000)
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

function loading_text(id, text, timeout) {
    document.getElementById(id).innerHTML = text
    setTimeout(() => {
        document.getElementById(id).innerHTML = ""
    }, timeout)
}

function compair_lists() {
    let pco_song_list = document.getElementById('pco_song_list')
    let spotify_song_children = document.getElementById('spotify_song_list')

    // if(pco_song_list.children.length == 1 && spotify_song_children.children.length == 1 ) {
    //     alert('Please Select a Spotify and PCO playlist')
    //     return
    // } else if(pco_song_list.children.length == 1 || spotify_song_children.children.length == 1){
    //     alert('Please Select a Spotify and PCO playlist')
    //     return
    // }
    let pco_list = []
    let spotify_list = []
    for(let i = 0; i < spotify_song_children.children.length; i++) {
        spotify_list.push(spotify_song_children.children[i].innerHTML)
    }

    for(let i = 0; i < pco_song_list.children.length; i++) {
        pco_list.push(pco_song_list.children[i].innerHTML)
    }

    for(let spotify_items = 0; spotify_items < spotify_list.length; spotify_items++) {
        for(let pco_items = 0; pco_items < pco_list.length; pco_items++) {
            if(pco_list[pco_items].includes(spotify_list[spotify_items])) {
                let spotify_match = spotify_song_children.children[spotify_items].id

                spotify_playlist_snapshot_id = spotify_get_playlist_snapshot_id()
                spotify_playlist_id = spotify_get_playlist_id()

                spotify_call_delete_api(`https://api.spotify.com/v1/playlists/${spotify_playlist_id}/tracks`,spotify_match, spotify_playlist_snapshot_id).then ((data) => {
                    console.log(`spotify:track:${spotify_match}`)
                    data = JSON.parse(data)
                    console.log(data)
                })

                console.log(document.getElementById(spotify_match))
                console.log(`PCO MATCH: "${pco_list[pco_items]}"`)
                console.log(`SPOTIFY MATCH: "${spotify_song_children.children[spotify_items].id}"`)
            }
        }
    }

}

function spotify_get_playlist_snapshot_id() { 
    let playlists = document.getElementById('playlists')
    let selected_playlist = playlists.options[playlists.selectedIndex]
    return spotify_playlist_snapshot_id = selected_playlist.getAttribute('data-snapshot-id')
}

function spotify_get_playlist_id() {
    return spotify_playlist_id = document.getElementById('playlists').value
}


async function spotify_call_delete_api(url, spotify_match, spotify_playlist_id) {
    const spotify_access_info = JSON.stringify({
        "spotify_access_token": localStorage.getItem('spotify_access_token'),
        "url": url,
        test: 
            {
                tracks:[
                    {
                        uri: `spotify:track:${spotify_match}`
                    }
                ],
                snapshot_id: `${spotify_playlist_id}`
            }
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

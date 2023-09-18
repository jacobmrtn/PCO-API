const pco_authorize_link = 'https://api.planningcenteronline.com/oauth/authorize'
const pco_token_link = 'https://api.planningcenteronline.com/oauth/token'
//const pco_client_id = ''
const pco_uri = 'http://127.0.0.1:8888/app.html'
const scope = 'services'


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
    fetch('pco_request_access_token.php', {
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
    const response = await fetch('pco_call_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: pco_access_info
    })
    
    return response.json() //return response from the API
}

function populate_plan_dropdown(parsed_data) {
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
    console.warn("LOADING SERVICES")
    // Load data from PCO and wait & Then use that data to populate the dropdown
    pco_call_api("https://api.planningcenteronline.com/services/v2/service_types/50209/plans?order=-created_at").then ((data) => {
        data = JSON.parse(data)
        populate_plan_dropdown(data)
        loading_text('pco_loading_text', 'DONE!', 1000)
    })
}

function pco_get_songs() {
    let apiLink = document.getElementById('plans').value + '/items'
    console.warn("LOADING PLAN ITEMS")
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

    if(pco_song_list.children.length == 1 && spotify_song_children.children.length == 1 ) {
        alert('Please Select a Spotify and PCO playlist')
        return
    } else if(pco_song_list.children.length == 1 || spotify_song_children.children.length == 1){
        alert('Please Select a Spotify and PCO playlist')
        return
    }
    let pco_list = []
    let spotify_list = []
    for(let i = 0; i < spotify_song_children.children.length; i++) {
        spotify_list.push(spotify_song_children.children[i].innerHTML)
    }

    for(let i = 0; i < pco_song_list.children.length; i++) {
        pco_list.push(pco_song_list.children[i].innerHTML)
    }

    const hasMatch = spotify_list.some(item1 =>
        pco_list.some(item2 => item1.includes(item2))    
    )

    console.log(hasMatch)


    console.table(spotify_list)
    console.table(pco_list)
}

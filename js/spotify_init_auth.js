let redirect_uri = "http://127.0.0.1:8888/spotify.html"
let app_redirect = "http://127.0.0.1:8888/app.html"

function on_page_load() {
    if (window.location.search.length > 0){
        spotify_handle_access_token_redirect()
    } else {
        let access_token = localStorage.getItem("spotify_access_token")
        if (access_token == null ) {
            console.warn("User probably requested token again. Clear localstorage")
            console.table(localStorage)
        } else if(access_token != null){
            window.location.href = app_redirect
        }
    }
}

function spotify_handle_access_token_redirect() {
    let spotify_code = spotify_get_code()

    spotify_get_access_token(spotify_code)
    window.history.pushState("", "", redirect_uri)
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
            document.getElementById('title').innerHTML = 'Success'
            window.location.href = app_redirect
        })
        .catch(error => {
            console.error(error)
        })
}

// function used to get the access code from the URI
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
function main_app_redirect() {
    window.location.href = app_redirect
}

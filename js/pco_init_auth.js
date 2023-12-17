window.addEventListener('load', on_page_load())
const pco_client_id = '436b59ef4349b87ade668b83f3a9b4b4f7dd6719e6c12789ff235b584cb90819'
const pco_uri = 'https://192.168.200.143/pco_init.html'
const app_redirect = "https://192.168.200.143/app.html"
const scope = 'services'

function on_page_load() {
    if (window.location.search.length > 0){
        pco_handle_redirect()
    } 
}

function get_code_url() {
    window.location.href = `https://api.planningcenteronline.com/oauth/authorize?client_id=436b59ef4349b87ade668b83f3a9b4b4f7dd6719e6c12789ff235b584cb90819&redirect_uri=https://192.168.200.143/pco_init.html&response_type=code&scope=services`
}

function pco_handle_redirect() {
    pco_get_code()
    pco_request_access_token()
    window.history.pushState("", "", 'https://192.168.200.143/pco_init.html')
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
    if(localStorage.getItem('pco_code') == "null") {

    }
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
            document.getElementById('title').innerHTML = 'Success'
            window.location.href = app_redirect
        })
        .catch(error => {
            console.error(error)
        })
}

function pco_refresh_access_token() {
    const request_info = JSON.stringify({
        "pco_refresh_token": localStorage.getItem('pco_refresh_token')
    })

    fetch('./php/pco/pco_refresh_access_token.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: request_info
    }) 
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data)
            if(data.access_token) {
                loading_text('pco_loading_text', 'Successfully refreshed token!', 5000, 'success')
                localStorage.setItem('pco_access_token', data.access_token) 
                localStorage.setItem('pco_refresh_token', data.refresh_token)
            } else {
                loading_text('pco_loading_text', 'Access token expired - Requst a new one!', null, 'error-text')
            }
        })
        .catch(error => {
            console.error(error)
        })
}

function main_app_redirect() {
    window.location.href = app_redirect
}
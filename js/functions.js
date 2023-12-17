function loading_text(id, text, timeout, type) {
    let element = document.getElementById(id)

    if(type === 'error') {
        element.setAttribute('class', 'error-text')
        element.innerText = text
    } else if(type === 'success') {
        element.setAttribute('class', 'success-text')
        element.innerText = text
        setTimeout(() => {
            element.innerHTML = ''
            element.removeAttribute('class', 'success-text')
        }, timeout)
    } else if(type === 'refresh') {
        element.setAttribute('class', 'refresh-text')
        element.innerText = text
        setTimeout(() => {
            element.innerHTML = ''
            element.removeAttribute('class', 'refresh-text')
        }, timeout)
    }

}

function add_dropdown_header(id, text) {
    let node = document.createElement("option")
    node.innerHTML = text
    node.setAttribute('class', 'dropdown-header')
    document.getElementById(id).appendChild(node)
}

function remove_all_children(elementId){
    let node = document.getElementById(elementId)
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
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

function spotify_refresh_access_token() {
    const request_info = JSON.stringify({
        "spotify_refresh_token": localStorage.getItem('spotify_refresh_token'),
    })
    fetch('./php/spotify/spotify_refresh_access_token.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: request_info
    })        
        .then(response => response.json())
        .then(data => {
            data = JSON.parse(data)
            if(data.access_token) {
                localStorage.setItem('spotify_access_token', data.access_token)
                loading_text('spotify_loading_text', 'Successfully refreshed token!', 5000, 'success')
            } else if(data.refresh_token) {
                localStorage.setItem('spotify_access_token', data.access_token)
                localStorage.setItem('spotify_refresh_token', data.refresh_token)
                loading_text('spotify_loading_text', 'Successfully refreshed token!', 5000, 'success')
            }
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

export { loading_text, remove_all_children, spotify_call_api, spotify_refresh_access_token, pco_refresh_access_token, add_dropdown_header }

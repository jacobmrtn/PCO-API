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
    }

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

export { loading_text, remove_all_children, spotify_call_api }
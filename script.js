const pco_AUTHORIZE = 'https://api.planningcenteronline.com/oauth/authorize'
const pco_TOKEN = 'https://api.planningcenteronline.com/oauth/token'
//const pco_client_id = ''
const pco_uri = 'http://127.0.0.1:8888/index.html'
const scope = 'services'
const output = document.getElementById('output')

function onPageLoad() {
    if (window.location.search.length > 0){
        handlePCOredirect()
    }
}

function handlePCOredirect() {
    getCode()
    pco_request_token()
    window.history.pushState("", "", pco_uri) // remove param from url
}

function pco_init_oauth() {
    window.location.href =`https://api.planningcenteronline.com/oauth/authorize?client_id=${pco_client_id}&redirect_uri=${pco_uri}&response_type=code&scope=${scope}`
}

function getCode() {
    let code = null
    const queryString = window.location.search
    if(queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    localStorage.setItem('pco_code', code)
    console.log("CODE " + code)
    return code
}

function pco_request_token() {
    fetch('pco_request_token.php', {
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

function pco_callApi() {
    const pco_access_token = localStorage.getItem('pco_access_token');
    fetch('pco_request_api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: pco_access_token
    })
        .then(response => response.json())
        .then(data => {
            let x = JSON.parse(data)
            console.log(x.data[0].attributes.short_dates)
        })
        .catch(error => {
            console.log("pco_callApi: Error:", error)
        })

}

<?php
    $config_path = __DIR__ . '/../../config/config.ini';
    $config = parse_ini_file($config_path, true);

    $spotify_code = json_decode(file_get_contents('php://input'), true);
    $spotify_token_url = 'https://accounts.spotify.com/api/token';

    $body = array(
        'grant_type' => 'authorization_code',
        'code' => "{$spotify_code}",
        'redirect_uri' => 'http://127.0.0.1:8888/spotify.html',
        'client_id' => $config['spotify']['client_id'],
        'client_secret' => $config['spotify']['client_secret'],
    );

    $queryString = '';
    foreach ($body as $key => $value) {
        $queryString .= $key . '=' . $value . '&';
    }
    $queryString = rtrim($queryString, '&');

    $body = $queryString;
    urlencode($body);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $spotify_token_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    
    $response = curl_exec($ch);
    curl_close($ch);
    echo json_encode($response);
?>
    

<?php
    $config_path = __DIR__ . '/../../config/config.ini';
    $config = parse_ini_file($config_path, true);

    $client_id = $config['spotify']['client_id'];
    $client_secret = $config['spotify']['client_secret'];

    $spotify_token_url = 'https://accounts.spotify.com/api/token';
    $spotify_refresh_token = json_decode(file_get_contents('php://input'), true);
    
    $body = array(
        'grant_type' => 'refresh_token',
        'refresh_token' => $spotify_refresh_token,
        'client_id' => $config['spotify']['client_id'],
    );

    $queryString = '';
    foreach ($body as $key => $value) {
        $queryString .= $key . '=' . $value . '&';
    }

    $queryString = rtrim($queryString, '&');
    $body = $queryString;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $spotify_token_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($client_id. ":" . $client_secret),
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    
    $response = curl_exec($ch);
    curl_close($ch);
    echo json_encode($response);
?>
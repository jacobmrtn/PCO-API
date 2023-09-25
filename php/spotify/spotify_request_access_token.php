<?php
    $config_path = __DIR__ . '/../../config/config.ini';
    $config = parse_ini_file($config_path, true);
    
    $spotify_authorize_url = 'https://accounts.spotify.com/authorize?';
    $spotify_scope = 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';

    $params = array(
        'response_type' => 'code',
        'client_id' => $config['spotify']['client_id'],
        'show_dialog' => 'true',
        'redirect_uri' => $config['spotify']['redirect_uri'],
        'scope' => $spotify_scope
    );
    

    $queryString = '';
    foreach ($params as $key => $value) {
        $queryString .= $key . '=' . $value . '&';
    }
    $queryString = rtrim($queryString, '&');

    $spotify_authorize_url = $spotify_authorize_url .= $queryString;
    echo json_encode($spotify_authorize_url)
?>

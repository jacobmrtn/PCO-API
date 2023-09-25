<?php
    $post_info = json_decode(file_get_contents('php://input'), true);
    $spotify_url = $post_info["url"];
    $spotify_access_token = $post_info["spotify_access_token"];
    $spotify_method = $post_info['spotify_request_method'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $spotify_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $spotify_method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer {$spotify_access_token}",
    ]);

    $response = json_encode(curl_exec($ch));
    echo $response;
?>

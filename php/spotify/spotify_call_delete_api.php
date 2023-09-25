<?php
    $post_info = json_decode(file_get_contents('php://input'), true);
    $spotify_song_uri = $post_info['spotify_song_uri'];
    $spotify_playlist_id = $post_info['spotify_snapshot_id'];

    $post_data = '{
        "tracks": [
            {
                "uri": "' . $spotify_song_uri . '"
            }
        ],
        "snapshot_id": "' . $spotify_playlist_id . '"
    }';

    echo $post_data;

    $spotify_url = $post_info["url"];
    $spotify_access_token = $post_info["spotify_access_token"];
    $spotify_method = $post_info['spotify_request_method'];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $spotify_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $spotify_method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer {$spotify_access_token}",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));

    $response = json_encode(curl_exec($ch));
    echo $response;
?>

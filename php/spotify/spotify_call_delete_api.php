<?php
    $post_info = json_decode(file_get_contents('php://input'), true);
    $spotify_url = $post_info["url"];
    $spotify_access_token = $post_info["spotify_access_token"];
    $spotify_delete_data = $post_info["request_body"];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $spotify_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer {$spotify_access_token}",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($spotify_delete_data));

    $response = curl_exec($ch);

    if($response !== false) {
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if($httpcode == 200) {
            echo json_encode($response);
        } elseif($httpcode == 400) {
            echo json_encode($response);
        } else {
            echo json_encode($response);
        }
    }
?>

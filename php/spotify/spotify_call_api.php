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


    $response = curl_exec($ch);
    if($response !== false) {
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if($http_code == 200) {
            echo json_encode($response);        
        } elseif($http_code == 401) {
            $response = '{"error": "401"}';
            echo json_encode($response);        
        }
    }
    
?>

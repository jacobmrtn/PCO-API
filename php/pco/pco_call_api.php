<?php
    $post_info = json_decode(file_get_contents('php://input'), true);
    $pco_url = $post_info["url"];
    $pco_access_token = $post_info["pco_access_token"];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $pco_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$pco_access_token}",
    ]);

    $response = json_encode(curl_exec($ch));
    curl_close($ch);
    echo $response;
    
?>

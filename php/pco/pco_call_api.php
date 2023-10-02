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

    $response = curl_exec($ch);
    if($response !== false) {
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if($http_code == 200) {
            echo json_encode($response);        
        } elseif($http_code == 401) {
            $response = '401';
            echo json_encode($response);        
        }
    }
    curl_close($ch);
    
?>

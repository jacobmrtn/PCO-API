<?php
    #$pco_secret = '';
    #$pco_client_id = '';
    $pco_uri = 'http://127.0.0.1:8888/app.html';

    $pco_code = json_decode(file_get_contents('php://input'), true);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.planningcenteronline.com/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'grant_type' => 'authorization_code',
        'code' => "{$pco_code}",
        'client_id' => "{$pco_client_id}",
        'client_secret' => "{$pco_secret}",
        'redirect_uri' => "{$pco_uri}",
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    echo "{$response}";
?>



<?php
    $config_path = __DIR__ . '/../../config/config.ini';
    $config = parse_ini_file($config_path, true);
    $post_info = json_decode(file_get_contents('php://input'), true);
    $pco_refesh_token = $post_info["pco_refresh_token"];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.planningcenteronline.com/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'client_id' => $config['pco']['client_id'],
        'client_secret' => $config['pco']['secret'],
        'refresh_token' => $pco_refesh_token,
        'grant_type' => 'refresh_token',
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    echo json_encode($response);
?>

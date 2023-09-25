<?php
    $config_path = __DIR__ . '/../../config/config.ini';
    $config = parse_ini_file($config_path, true);
    
    $pco_code = json_decode(file_get_contents('php://input'), true);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.planningcenteronline.com/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'grant_type' => 'authorization_code',
        'code' => "{$pco_code}",
        'client_id' => $config['pco']['client_id'],
        'client_secret' => $config['pco']['secret'],
        'redirect_uri' => $config['pco']['redirect_uri'],
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    echo $response;
?>



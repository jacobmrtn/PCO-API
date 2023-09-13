<?php
    $pco_access_token = file_get_contents('php://input');

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.planningcenteronline.com/services/v2/service_types/50209/plans?order=-created_at");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$pco_access_token}",
    ]);

    $response = json_encode(curl_exec($ch));
    curl_close($ch);
    echo $response;
    
?>

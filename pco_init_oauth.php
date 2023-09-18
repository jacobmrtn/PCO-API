<?php 
    //$pco_secret = '';
    //$pco_client_id = '';
    $pco_uri = 'http://127.0.0.1:8888/app.html';
    $scope = 'services';
    
    header("Location: https://api.planningcenteronline.com/oauth/authorize?client_id={$pco_client_id}&redirect_uri={$pco_uri}&response_type=code&scope={$scope}");
    exit;
?>

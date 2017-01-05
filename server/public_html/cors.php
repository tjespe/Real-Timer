<?php

header("Access-Control-Allow-Origin: *");

$url = "http://".$_GET['url'];
echo file_get_contents($url);

 ?>

<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: text/css;charset=utf-8");
ini_set('display_errors', 0);

if (file_get_contents("mode") == "1") {
  echo file_get_contents("latest.css");
} else {
  $path = "https://tjespe.github.io/Real-Timer/assets";
  $css = file_get_contents("$path/main.css");
  echo $css;
}

 ?>

<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: text/javascript;charset=utf-8");
ini_set('display_errors', 0);

if (file_get_contents("mode") == "1") {
  echo file_get_contents("latest2.js");
} else {
  $js = "";
  $path = "https://tjespe.github.io/Real-Timer/assets";
  $js .= file_get_contents("$path/converter.min.js");
  //$js .= file_get_contents("$path/converter.min.js");
  echo $js;
}

 ?>

<?php

$path = '../..';
require_once $path . '/minify/src/Minify.php';
require_once $path . '/minify/src/CSS.php';
require_once $path . '/minify/src/JS.php';
require_once $path . '/minify/src/Exception.php';
require_once $path . '/path-converter/src/Converter.php';
use MatthiasMullie\Minify;

$dir = "https://tjespe.github.io/Real-Timer/assets";
$version = ((int) file_get_contents("../version")) + 1;

$js_raw = file_get_contents("$dir/app.js");
$js_raw .= "app.value('version', $version);";
$js = minify($js_raw, "js");
//$js .= file_get_contents("$dir/converter.min.js");

$css_minifier = new Minify\CSS(file_get_contents("$dir/main.css"));
$css = $css_minifier->minify();

$js2 = file_get_contents("$dir/converter.min.js");

$timestamp = time();
$builds = json_decode(file_get_contents("builds.json"));
array_push($builds->{'js'}, "$timestamp.js");
array_push($builds->{'js2'}, "$timestamp.js");
array_push($builds->{'css'}, "$timestamp.css");
file_put_contents("builds/js/$timestamp.js", $js);
file_put_contents("builds/js2/$timestamp.js", $js2);
file_put_contents("builds/css/$timestamp.css", $css);
file_put_contents("builds.json", json_encode($builds));
file_put_contents("../latest.js", $js);
file_put_contents("../latest2.js", $js2);
file_put_contents("../latest.css", $css);

file_put_contents("../version", (string) $version);
file_put_contents('../mode', '1');
header("Location: ./");
die();


function minify($string, $name)
{
  //echo "minify() called with string:<br>$string<br><br>";

  $url = 'https://closure-compiler.appspot.com/compile';
  $fields_string = "output_format=json&output_info=statistics&compilation_level=SIMPLE_OPTIMIZATIONS&output_file_name=$name.min.js&js_code=".urlencode($string);
  //echo "POST-request ready with parameters:<br>$fields_string<br><br>";

  //open connection
  $ch = curl_init();
  echo "Initiated curl<br><br>";

  //set the url, number of POST vars, POST data
  curl_setopt($ch,CURLOPT_URL,$url);
  curl_setopt($ch,CURLOPT_POST,count($fields));
  curl_setopt($ch,CURLOPT_POSTFIELDS,$fields_string);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  echo "All curl options are set<br><br>";

  //execute post
  $result = curl_exec($ch);
  echo "Response recieved:<br>".$result."<br><br>";
  curl_close($ch);
  //echo curl_getinfo($ch);
  //var_dump($result);
  $output_file_path = json_decode($result)->{'outputFilePath'};
  echo "Getting minified code from https://closure-compiler.appspot.com$output_file_path<br><br>";
  $output = file_get_contents('https://closure-compiler.appspot.com'.$output_file_path);
  //echo "Minified code recieved:<br><code>$output</code><br><br>";
  return $output;
}

 ?>

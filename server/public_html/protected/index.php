<?php

$modes = ["Development", "Stable"];
$mode = (int) file_get_contents('../mode');

 ?>
<title>Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0">
<style media="screen">
  c, a {
    color: #607d8b;
  }
  body {
    font-family: ubuntu, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
</style>
<h1>Overview</h1>
<h3>Version: <c><?= file_get_contents('../version') ?></c></h3>
<h3>Active mode: <c><?= $modes[$mode] ?></c></h3>

<h1>Actions</h1>
<h3><a href="build.php?d=<?= time() ?>">Build minified code</a></h3>
<h3><a href="dev-mode.php?d=<?= time() ?>">Switch mode to development</a></h3>

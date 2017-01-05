app.directive(['$http', '$chttp', function ($http, $chttp) {
  return {
    restrict: 'E',
    templateUrl: '//real-timer-server.tk/getcode.php?file=widget',
    link: function (scope, element) {
      // code ...
    }
  }
}]);

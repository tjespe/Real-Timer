app.directive('widget', ['$http', '$chttp', function ($http, $chttp) {
  return {
    templateUrl: '/assets/widget.html',
    controller: function ($scope, $element, $attrs) {
      let vm = this;
      vm.url = "https://reiseplanlegger-ekstern.ruter.no/no/Sanntid/For/("+$scope.stop.ID+")"+$scope.stop.Name+"%20("+$scope.stop.District+")?x-requested-with=XMLHttpRequest";
      vm.content = "<c>Laster inn...</c><br><br><br>";
      vm.timestamp = "";
      vm.loading = false;
      vm.update = ()=>{
        vm.loading = true;
        $http.get(vm.url+"&d="+Date.now()).success((data)=>{
          vm.loading = false;
          vm.content = $(data).find("ul").html() || $(data).find(".travelresultsNone").html();
          vm.content = vm.content.replace(/href=\"\/no\/Avvik\/Avganger\/(\d+)\"/g, (str, id)=>{
            return "href=\"https://ruter.no/avvik/avviksmelding?deviationid="+id+"\"";
          });
          vm.timestamp = $(data).find(".time").html();
        }).error(vm.throwError);
      };
      vm.throwError = (data, e)=>{
        console.log(data, e);
        vm.content = "En feil har oppstått, prøv å laste inn på nytt. Status: "+e;
        vm.loading = false;
      };
      vm.update();
    },
    controllerAs: 'w'
  }
}]);

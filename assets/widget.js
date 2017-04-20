app.directive('widget', ['$http', '$chttp', '$q', function ($http, $chttp, $q) {
  return {
    templateUrl: '/assets/widget.html',
    controller: function ($scope, $element, $attrs) {
      let vm = this;
      vm.url = "https://reiseplanlegger-ekstern.ruter.no/no/Sanntid/For/("+$scope.stop.ID+")"+$scope.stop.Name+"%20("+$scope.stop.District+")?x-requested-with=XMLHttpRequest";
      vm.content = "<c>Laster inn...</c><br><br><br>";
      vm.timestamp = "";
      vm.canceler = $q.defer();
      vm.loading = false;
      vm.hasLoaded = false;
      if (typeof $scope.m.realTimeData[$scope.stop.ID] !== 'undefined') {
        vm.content = $scope.m.realTimeData[$scope.stop.ID];
        vm.hasLoaded = true;
      }
      vm.update = ()=>{
        vm.canceler = $q.defer();
        vm.hasLoaded = true;
        vm.loading = true;
        $http.get(vm.url+"&d="+Date.now(), {timeout: vm.canceler.promise}).success((data)=>{
          vm.loading = false;
          let content = $(data).find("ul").html() || $(data).find(".travelresultsNone").html();
          content = content.replace(/href=\"\/no\/Avvik\/Avganger\/(\d+)\"/g, (str, id)=>"href=\"https://ruter.no/avvik/avviksmelding?deviationid="+id+"\"");
          vm.setContent(content);
          vm.timestamp = $(data).find(".time").html();
        }).error(vm.throwError);
      };
      vm.throwError = (data, e)=>{
        vm.content = "En feil har oppstått, prøv å laste inn på nytt. Status: "+e;
        vm.loading = false;
      };
      $scope.$watch('m.loadLimit', ()=>{vm.loadIf()});
      $scope.$watch('stop.hasExpanded', ()=>{vm.loadIf()});
      vm.loadIf = ()=>{
        if (!vm.hasLoaded && ($scope.index < $scope.m.loadLimit || $scope.stop.hasExpanded)) vm.update();
      };
      vm.setContent = (data)=>{
        vm.content = data;
        $scope.m.realTimeData[$scope.stop.ID] = data;
      };
      $scope.$on("$destroy", ()=>{vm.canceler.resolve()});
    },
    controllerAs: 'w'
  }
}]);

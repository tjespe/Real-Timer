let app = angular.module('app', []);

app.config(["$sceProvider", '$controllerProvider', '$provide', '$sceDelegateProvider', '$compileProvider', function($sceProvider, $controllerProvider, $provide, $sceDelegateProvider, $compileProvider) {
  $sceProvider.enabled(false);

  // Provider-based controller to enable lazy loading of controllers.
  app.controller = function( name, constructor ) {
    $controllerProvider.register( name, constructor );
    return( this );
  };

  // Provider-based directive to enable lazy loading of directives.
  app.directive = function( name, factory ) {
    $compileProvider.directive( name, factory );
    return( this );
  };
}]);

app.controller('masterCtrl', ['$http', '$httpx', '$timeout', '$interval', '$q', '$window', '$scope', function ($http, $httpx, $timeout, $interval, $q, $window, $scope) {
  let vm = this;
  vm.q = "";
  vm.css = "";
  vm.jqLoaded = false;
  vm.raw_coords = [0,0];
  vm.coords = [0,0];
  vm.conv = $httpx.get('assets/converter.min.js', {lifetime: Infinity}).then((data)=>{
    eval(data);
  }).catch((data, status)=>{
    vm.status = "Vennligst oppdater siden";
  });

  let reset_data = ()=>{
    if (!vm.q.length) {
      vm.status = "Laster inn data…";
      vm.success = false;
    }
    vm.canceler = $q.defer();
    vm.loadLimit = 5;
    vm.data = [];
    vm.realTimeData = {};
  }

  let get_data = (url_param)=>{
    $httpx.get('//script.google.com/macros/s/AKfycbzQ4aytAhVinfiYxMy2G-4whWFXv1V1YIbc1LE8KQPZcQQT6Odi/exec?url='+url_param, {lifetime:Infinity, timeout:vm.canceler.promise, alt_urls:['https://real-timer-server.tk:2087/?url='+url_param]}).then(function (data) {
      for (let i = 0; i < data.length; i++) setValues(data[i]);
      if (!vm.lockView && vm.data != data) {
        vm.success = false; // Set success to false because this forces the whole view to update, without this, weird glitches occured
        if (vm.q.length) vm.lockView = true; // Set vm.lockView to true if in search mode, because no updating of view is needed
        if (data.length > 0) {
          vm.data = data;
          $timeout(()=>vm.success = true, 0); // Set success back to true to show the view again, with a 0 timeout because it lowers the glitch rate and allows the client to load the view when it has CPU power ready (I think)
          $interval(()=>vm.loadLimit++, 2000);
        } else {
          vm.status = "Fant ingen holdeplasser.";
        }
      }

    }).catch(()=>{
      vm.status = "Kunne ikke laste inn data.";
    });
  };

  // Block updating view after user scrolls
  $timeout(()=>angular.element($window).on("scroll", vm.clearWatch), 1200);

  let geo_success = (position)=>{
    if (!vm.success) reset_data(); // Do not reset data if data is already displayed
    if (!vm.q.length) { // Get stops nearby if not in search mode
      vm.conv.then(()=>{
        vm.raw_coords = [position.coords.latitude, position.coords.longitude];
        vm.coords = convert(vm.raw_coords[0], vm.raw_coords[1]);
        let url_param = 'reisapi.ruter.no%2FPlace%2FGetClosestPlacesExtension%3Fcoordinates%3Dx%3D'+Math.round(vm.coords[0])+'%2Cy%3D'+Math.round(vm.coords[1])+'%26proposals%3D'+String(22);
        get_data(url_param);
      });
    }
  }
  let geo_error = (e)=>{
    $scope.$apply(()=>vm.status = "Fikk ikke tilgang til stedstjenester");
    console.log(e);
  }
  let geo_options = {
    enableHighAccuracy: true,
    maximumAge        : 0,
    timeout           : 5000
  }
  vm.get_position = ()=>{
    vm.lockView = false;
    vm.status = "Lokaliserer…";
    vm.success = false;
    // Use saved location if already located
    if (vm.raw_coords[0] !== 0) geo_success({coords: {latitude: vm.raw_coords[0], longitude: vm.raw_coords[1]}});
    // Try to get location
    if ('geolocation' in navigator) {
      if ('onLine' in navigator && !navigator.onLine) {
        vm.status = "Du er ikke koblet til internett";
        vm.retryInterval = $interval(get_position, 1500);
      } else {
        vm.wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);
				$interval.cancel(vm.retryInterval);
      }
    } else {
      geo_error();
    }
  }
  vm.search = ()=>{
    if (vm.q.length) {
      vm.status = "Søker…";
      vm.clearWatch();
      reset_data();
      vm.lockView = false;
      get_data("ruter.no%2Fwebapi%2Fgetplaces%3Fsearch%3D"+encodeURIComponent(vm.q));
    } else {
      vm.get_position();
    }
  };
  $scope.$watch('m.q', vm.search, true);
  vm.get_position();
  $httpx.get('assets/glyphicons.min.css', {lifetime: Infinity}).then((data)=>vm.css += data);
  $httpx.get('assets/ubuntu.css', {lifetime: Infinity}).then((data)=>vm.css += data);
  vm.jq = $httpx.get('https://code.jquery.com/jquery-3.1.1.min.js', {lifetime: Infinity});
  vm.jq.then((data)=>{
    eval(data);
    vm.jqLoaded = true;
  });
  vm.clearWatch = ()=>{
    vm.lockView = true;
    navigator.geolocation.clearWatch(vm.wpid);
    vm.canceler.resolve();
  };
  function setValues(obj) {
    obj.expanded = false;
    obj.hasExpanded = false;
    obj.height = "25px";
  }
}]);

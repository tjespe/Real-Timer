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

app.controller('masterCtrl', ['$http', '$chttp', '$timeout', '$interval', '$q', function ($http, $chttp, $timeout, $interval, $q) {
  let vm = this;
  vm.css = "";
  vm.jqLoaded = false;
  vm.status = "Lokaliserer…";
  vm.success = false;
  vm.userTapped = false;
  vm.data = [];
  vm.realTimeData = {};
  vm.coords = [0,0];
	vm.retryInterval;
  vm.conv = $chttp.get('assets/converter.min.js', 0).then((data)=>{
    eval(data);
  }).catch((data, status)=>{
    vm.status = "Vennligst oppdater siden";
  });
  vm.canceler = $q.defer();
  vm.loadLimit = 5;

  let geo_success = (position)=>{
    vm.conv.then(()=>{
      vm.coords = convert(position.coords.latitude, position.coords.longitude);
      vm.status = "Laster inn data…";
      let proposals = 22, url_param = 'reisapi.ruter.no%2FPlace%2FGetClosestPlacesExtension%3Fcoordinates%3Dx%3D'+Math.round(vm.coords[0])+'%2Cy%3D'+Math.round(vm.coords[1])+'%26proposals%3D'+proposals;
      $chttp.get('//script.google.com/macros/s/AKfycbzQ4aytAhVinfiYxMy2G-4whWFXv1V1YIbc1LE8KQPZcQQT6Odi/exec?url='+url_param, 0, {}, vm.canceler.promise, ['https://real-timer-server.tk:2087/?url='+url_param]).then(function (data) {
        for (let i = 0; i < data.length; i++) setValues(data[i]);
        if (!vm.userTapped && vm.data != data) {
          vm.success = false;
          vm.data = data;
          $timeout(()=>vm.success = true, 0);
          $interval(()=>vm.loadLimit++, 2000);
        }
      }).catch(()=>{
        vm.status = "Kunne ikke laste inn data.";
      });
    });
  }
  let geo_error = ()=>{
    vm.status = "Fikk ikke tilgang til stedstjenester";
  }
  let geo_options = {
    enableHighAccuracy: true,
    maximumAge        : 0,
    timeout           : 5000
  }
  let get_position = ()=>{
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
  get_position();
  $chttp.get('assets/glyphicons.min.css', 0).then((data)=>vm.css += data);
  $chttp.get('assets/ubuntu.css', 0).then((data)=>vm.css += data);
  vm.jq = $chttp.get('https://code.jquery.com/jquery-3.1.1.min.js', 0);
  vm.jq.then((data)=>{
    eval(data);
    vm.jqLoaded = true;
  });
  vm.clearWatch = ()=>{
    vm.userTapped = true;
    navigator.geolocation.clearWatch(vm.wpid);
    vm.canceler.resolve();
  };
  function setValues(obj) {
    obj.expanded = false;
    obj.hasExpanded = false;
    obj.height = "25px";
  }
}]);

app.service('$chttp', ['$http', '$q', '$timeout', function ($http, $q, $timeout) {
  let vm = this;

  vm.get = (url, timeout, options, extra_timeout, alternate_urls)=>{
    let deferred = $q.defer();
    if (typeof alternate_urls === 'undefined') alternate_urls = [];
    if (typeof options === 'undefined') options = {};
    options.timeout = deferred.promise;
    $http.get(url, options).success(function (data) {
      try {
        localStorage[url] = JSON.stringify(data);
      } catch (e) { }
      deferred.resolve(data);
    }).error(function (data, status) {
      if (typeof Storage !== "undefined" && url in localStorage) {
        deferred.resolve(JSON.parse(localStorage[url]));
      }
      deferred.reject("ERROR");
    });
    if (typeof timeout !== "undefined") {
      $timeout(function () {
        try {
          deferred.resolve(JSON.parse(localStorage[url]));
        } catch (e) {console.warn(e);}
      }, timeout);
    }
    if (typeof extra_promise !== "undefined") {
      extra_promise.catch(()=>{
        deferred.reject("Canceled");
      });
    }
    for (let i = 0;i<alternate_urls.length;i++) {
      $http.get(alternate_urls[i], options).success(function (data) {
        try {
          localStorage[url] = JSON.stringify(data);
        } catch (e) { }
        deferred.resolve(data);
      })
    }

    return deferred.promise;
  }
}]);

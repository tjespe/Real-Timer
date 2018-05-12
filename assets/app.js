const app = angular.module('app', []);

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
  const vm = this;
  vm.query = "";
  vm.css = "";
  let raw_coords = [0,0], coords = [0,0];

  /** Load library for converting lat/long to UTM */
  vm.conv = $httpx.get('assets/converter.min.js', {lifetime: Infinity}).then(eval).catch(()=>vm.status = "Vennligst oppdater siden");

  /** Functions for loading and resetting data */
  const reset_data = ()=>{
    if (typeof vm.query === "undefined" || !vm.query.length) {
      vm.status = "Laster inn data…";
      vm.success = false;
    }
    vm.canceler = $q.defer();
    vm.loadLimit = 5;
    vm.data = [];
    vm.realTimeData = {};
  };
  reset_data();
  const get_data = url_param=>{
    $httpx.get('//script.google.com/macros/s/AKfycbzQ4aytAhVinfiYxMy2G-4whWFXv1V1YIbc1LE8KQPZcQQT6Odi/exec?url='+url_param, {lifetime:Infinity, timeout:vm.canceler.promise, alt_urls:['https://cdn1.real-timer.cf/?url='+url_param, 'https://cdn2.real-timer.cf/?url='+url_param]}).then(function (data) {
      for (let i = 0; i < data.length; i++) setDefaultValues(data[i]);
      if (!vm.lockView && vm.data != data) {
        vm.success = false; // Set success to false because this forces the whole view to update, without this, weird glitches occured
        if (vm.query && vm.query.length) vm.lockView = true; // Set vm.lockView to true if in search mode, because no updating of view is needed
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            if (data[i].hasOwnProperty("Stops")) vm.data.push(...data[i].Stops); // Push all the stops if data[i] is a district
            else vm.data.push(data[i]); // Push the stop if data[i] is a stop
          }
          vm.data = vm.data.filter((stop, index, self) => self.findIndex(t => t.ID === stop.ID && t.Id === stop.Id) === index); // Remove duplicate entries
          $timeout(()=>vm.success = true, 0); // Set success back to true to show the view again, with a 0 timeout because it lowers the glitch rate and allows the client to load the view when it has CPU power ready (I think)
          $interval(()=>vm.loadLimit++, 2000);
        } else {
          vm.status = "Fant ingen holdeplasser.";
        }
      }
    }).catch(()=>vm.status = "Kunne ikke laste inn data.");
  };
  function setDefaultValues(obj) {
    obj.expanded = false;
    obj.hasExpanded = false;
    obj.height = "25px";
  }

  /** Search function */
  const search = ()=>{
    if (typeof vm.query === "string" && vm.query.length) {
      vm.status = "Søker…";
      vm.clearWatch();
      reset_data();
      vm.lockView = false;
      get_data("ruter.no%2Fwebapi%2Fgetplaces%3Fsearch%3D"+encodeURIComponent(vm.query));
    } else {
      vm.get_position();
    }
  };
  $scope.$watch('m.query', search, true);

  /** Functions for getting user position */
  const geo_success = position=>{
    if (!vm.success) reset_data(); // Do not reset data if data is already displayed
    if (typeof vm.query === "undefined" || !vm.query.length) { // Get stops nearby if not in search mode
      vm.conv.then(()=>{
        raw_coords = [position.coords.latitude, position.coords.longitude];
        coords = convert(raw_coords[0], raw_coords[1]);
        let url_param = 'reisapi.ruter.no%2FPlace%2FGetClosestPlacesExtension%3Fcoordinates%3Dx%3D'+Math.round(coords[0])+'%2Cy%3D'+Math.round(coords[1])+'%26proposals%3D'+String(22);
        get_data(url_param);
      });
    }
  }
  const geo_error = e=>{
    $scope.$apply(()=>vm.status = "Fikk ikke tilgang til stedstjenester");
    console.warn(e);
  }
  const geo_options = {
    enableHighAccuracy: true,
    maximumAge        : 0,
    timeout           : 5000
  }
  vm.get_position = ()=>{
    vm.lockView = false;
    vm.status = "Lokaliserer…";
    vm.success = false;
    // Use saved location if already located
    if (raw_coords[0] !== 0) geo_success({coords: {latitude: raw_coords[0], longitude: raw_coords[1]}});
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

  /** Get position */
  vm.get_position();
  vm.clearWatch = ()=>{
    vm.lockView = true;
    navigator.geolocation.clearWatch(vm.wpid);
    vm.canceler.resolve();
  };

  /** Block updating view after user scrolls */
  $timeout(()=>angular.element($window).on("scroll", vm.clearWatch), 1200);

  /** Get CSS */
  ["assets/glyphicons.min.css", "assets/ubuntu.css"].forEach(url=>$httpx.get(url, {lifetime: Infinity}).then(data=>vm.css += data));

  /** Google Analytics */
  if (!navigator.userAgent.includes('Speed Insights')) (function(a,e,f,g,b,c,d){a.GoogleAnalyticsObject=b;a[b]=a[b]||function(){(a[b].q=a[b].q||[]).push(arguments)};a[b].a=1*new Date;c=e.createElement(f);d=e.getElementsByTagName(f)[0];c.async=1;c.src=g;d.parentNode.insertBefore(c,d)})(window,document,"script","https://www.google-analytics.com/analytics.js","ga");ga("create","UA-69446843-3","auto");ga("send","pageview");
}]);

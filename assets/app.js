let app = angular.module('app', []);

app.config(["$sceProvider", '$controllerProvider', '$provide', '$sceDelegateProvider', function($sceProvider, $controllerProvider, $provide, $sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'https://static.thorin-games.tk/**',
    'https://thorin-apps.tk/**',
    'https://real-timer-server.tk/**',
    'https://ruter.no/**'
  ]);
  $sceProvider.enabled(true);

  // Provider-based controller.
  app.controller = function( name, constructor ) {
    $controllerProvider.register( name, constructor );
    return( this );
  };
}]);

app.controller('masterCtrl', ['$http', '$chttp', '$timeout', function ($http, $chttp, $timeout) {
  let vm = this;
  vm.css = "";
  vm.jqLoaded = false;
  vm.status = "Lokaliserer…";
  vm.success = false;
  vm.data = [];
  vm.coords = [0,0];
  vm.conv = $chttp.get('//real-timer-server.tk/getjs2.php', 0).then((data)=>{
    eval(data);
  }).catch((data, status)=>{
    vm.status = "Vennligst oppdater siden";
  });

  let geo_success = (position)=>{
    console.log(position);
    vm.conv.then(()=>{
      vm.coords = convert(position.coords.latitude, position.coords.longitude);
      vm.status = "Laster inn data…";
      $chttp.get('//real-timer-server.tk/cors.php?url=reisapi.ruter.no%2FPlace%2FGetClosestPlacesExtension%3Fcoordinates%3Dx%3D'+Math.round(vm.coords[0])+'%2Cy%3D'+Math.round(vm.coords[1])+'%26proposals%3D12', 0).then(function (data) {
        vm.success = true;
        vm.data = data;
        for (let i = 0; i < vm.data.length; i++) {
          setValues(vm.data[i]);
          if (vm.data[i].PlaceType == 'Area') {
            for (var j = 0; j < vm.data[i].Stops.length; j++) {
              setValues(vm.data[i].Stops[j]);
            }
          }
        }
      }).catch(()=>{
        vm.status = "Kunne ikke laste inn data.";
      });
    });
    navigator.geolocation.clearWatch(vm.wpid);
  }
  let geo_error = ()=>{
    vm.status = "Fikk ikke tilgang til stedstjenester";
  }
  let geo_options = {
    enableHighAccuracy: true,
    maximumAge        : 0,
    timeout           : 5000
  }
  if ('geolocation' in navigator) {
    vm.wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);
  } else {
    geo_error();
  }
  vm.toggle = (i, j)=>{
    if (typeof j === 'undefined') return toggleValues(vm.data[i]);
    return toggleValues(vm.data[i].Stops[j]);
  };
  $chttp.get('assets/glyphicons.min.css').then((data)=>{
    vm.css += data;
  }, 0);
  $chttp.get('//static.thorin-games.tk/css/ubuntu.php').then((data)=>{
    vm.css += data;
  }, 0);
  vm.jq = $chttp.get('https://code.jquery.com/jquery-3.1.1.min.js');
  vm.jq.then((data)=>{
    eval(data);
    vm.jqLoaded = true;
    let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    let eventer = window[eventMethod];
    let messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventer(messageEvent, function(e) {
      if (typeof e.data === "string" && e.data.indexOf(",")>-1) {
        let id = e.data.split(',')[0];
        let height = e.data.split(',')[1]+"px";
        for (let i = 0; i < vm.data.length; i++) {
          if (vm.data[i].ID == id) {
            $timeout(()=>{
              vm.data[i].height = height;
            }, 0);
          } else if (vm.data[i].PlaceType == "Area") {
            for (let j = 0; j < vm.data[i].Stops.length; j++) {
              if (vm.data[i].Stops[j].ID == id) {
                $timeout(()=>{
                  vm.data[i].Stops[j].height = height;
                }, 0);
              }
            }
          }
        }
      }
    }, false);
  });
  function setValues(obj) {
    obj.expanded = false;
    obj.hasExpanded = false;
    obj.height = "25px";
  }
  function toggleValues(obj) {
    obj.expanded = !obj.expanded;
    obj.hasExpanded = true;
  }
}]);

app.service('$chttp', ['$http', '$q', '$timeout', function ($http, $q, $timeout) {
  let vm = this;

  vm.get = (url, timeout, options)=>{
    let deferred = $q.defer();
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
    return deferred.promise;
  }
}]);

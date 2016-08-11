(function () {
  'use strict';

  angular
    .module('ga.groepcontroller', ['ga.services.alert', 'ga.services.dialog', 'ui.bootstrap'])
    .controller('GroepController', GroepController);

  GroepController.$inject = ['$scope', '$routeParams', '$window', '$location', 'RestService', 'AlertService', 'DialogService', '$rootScope', 'keycloak'];

  function GroepController($scope, $routeParams, $window, $location, RestService, AlertService, DialogService, $rootScope, keycloak) {
    $scope.markerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var tempId = 1;

    // groepen ophalen
    RestService.Groepen.get().$promise.then(
      function (result) {
        $scope.groepenlijst = [];
        //tijdelijk extra velden toevoegen aan het resultaat
        angular.forEach(result.groepen, function(value){
          value.vga = {
            "naam": "Nathan Wuyts",
            "email": "vga@scoutslatem.be"
          };
          value.groepsleiding = [
            {
              "naam": "Joke Scheerder",
              "email": "joke@scheerder.be"
                         },
            {
              "naam": "Bram Scheerder",
              "email": "bram@scheerder.be"
                         }
                       ];
            //temp fix positie
            value.adres.positie = {
              latitude: 51.209229,
              longitude: 4.438130
            }
          value.adres = [
            value.adres
          ];
          $scope.groepenlijst.push(value);
        })
        if($scope.activegroup == undefined){
          $scope.activegroup = result.groepen[0];
          loadGoogleMap(result.groepen[0]);
        }
      },
      function (Error){
      }
    );

    /*
     * Google Maps Functies
     * ----------------------------------
     */
    // initialize Google Map
    var loadGoogleMap = function(groep){
      var adressen = groep ? groep.adres : $scope.activegroup.adres;
      if(!$scope.googleMap){
        var mapOptions = {
          zoom: 15,
          center: berekenCenter(adressen)
        }
        $scope.googleMap = new google.maps.Map(document.getElementById("lokalen-kaart"), mapOptions);
        markersTekenen($scope.googleMap, adressen);
      } else {
        $scope.googleMap.setCenter(berekenCenter(adressen));
        markersTekenen($scope.googleMap, adressen);
      }

    }

    // Calculate center
    var berekenCenter = function(adressen){
        // maar 1 adres
        if (adressen.length == 1){
          return new google.maps.LatLng(adressen[0].positie.latitude, adressen[0].positie.longitude);
        }
        // meerder adressen
        else {
          var maxLat = 0;
          var minLat = 0;
          var maxLng = 0;
          var minLng = 0;
          angular.forEach(adressen, function(adres){
            var tempLat = aders.positie.latitude;
            var tempLng = adres.positie.longitude;
            // latithude controle

            if (tempLat > maxLat ){
              maxLat = tempLat;
            }
            else if (tempLat < minLat )  {
              minLat = tempLat
            }
            // Longithude controle
            if (tempLng > maxLng){
              maxLat = tempLat;
            }
            else if (tempLng < minLng )  {
              minLat = tempLat
            }
          });

          // calculate center
          var centerLat = ((maxLat-minLat) /2 ) + minLat;
          var centerLng = ( (maxLng-minLng) /2) + minLng;
          return new google.maps.LatLng(centerLat, centerLng);
        }
      }

    // Place Markers on Map
    var markersTekenen = function(map, adressen){
      if($scope.markers == null){
        $scope.markers = [];
      }
      clearMarkers();

      angular.forEach(adressen, function(value, key){
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(value.positie.latitude, value.positie.longitude),
          map: map,
          draggable: true,
          label: $scope.markerLabels[key],
          infoProp: value.straat + " " +value.nummer + ( value.bus ? (" " + value.bus) : "") + "," + "<br>" + value.postcode + " " + value.gemeente,
          adresId: value.id
        });
        marker = markerAddEvents(marker, map);
        $scope.markers[value.id] = (marker);
      });


    }

    // Remove allmarkers on Map
    var clearMarkers = function(){
      var markersCount = $scope.markers.length;
      for(var i=0; i < markersCount; i++){
        $scope.markers[i].setMap(null);
      }
      $scope.markers = [];
    }

    // openMarkerInfo
    var openInfoWindow = function(map, marker){
      var infoWindow = new google.maps.InfoWindow({
        content: marker.infoProp,
        maxWidth: 200
      });
      infoWindow.open(map, marker);
    }

    /*
     * event functies Lokalen
     * ----------------------------------
     */
    //dropdown verander van groep
    $scope.ChangeGroep = function () {
      loadGoogleMap();
    }

    // marker-icon click
    $scope.centerMap = function(lat, lng, id){
      if(lat == undefined || lng == undefined || id == undefined){
        return;
      }

      $scope.googleMap.setCenter(new google.maps.LatLng(lat, lng));
      google.maps.event.trigger($scope.markers[id], 'click');
    }

    // nieuw adres toeveogen
    $scope.addAdres = function () {
      var newAdres = {
        id: 'tempadres' + tempId,
        bus: null,

      }
      tempId++;
      $scope.activegroup.adres.push(newAdres);
      addMarkerFromNewAdres($scope.googleMap, newAdres)
    }

    // zoek gemeentes
    $scope.zoekGemeente = function(zoekterm){
      var resultaatGemeentes = [];
      return RestService.Gemeente.get({zoekterm:zoekterm, token:1}).$promise.then(
          function(result){
            angular.forEach(result, function(val){
              if(typeof val == 'string'){
                resultaatGemeentes.push(val);
              }
            });
            return resultaatGemeentes;
        });
    }

    // gemeente opslaan in het adres
    $scope.bevestigGemeente = function(item, adres) {
      adres.postcode = item.substring(0,4);
      adres.gemeente = item.substring(5);
      adres.straat = null;
      adres.bus = null;
      adres.nummer = null;
      adres.giscode = null;
      adres.land = "BE"
      // google geocode gemeente naar coordinaten
      // => teken marker + Info plaats deze marker op de juiste plaats.

    };

    // zoek straten en giscodes
    $scope.zoekStraat = function(zoekterm, adres){
      var resultaatStraten = [];
      return RestService.Code.query({zoekterm:zoekterm, postcode: adres.postcode}).$promise.then(
          function(result){
            angular.forEach(result, function(val){
                resultaatStraten.push(val);
            });
            return resultaatStraten;
        });
    }

    // straat en giscode opslaan in het adres
    $scope.bevestigStraat = function(item, adres) {
      adres.straat = item.straat;
      adres.giscode = item.code;

    };

    // marker van een nieuw adres op de kaart plaatsen.
    var addMarkerFromNewAdres = function (map, adres) {
      var marker = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        draggable: true,
        label: $scope.markerLabels[$scope.activegroup.adres.length - 1],
        infoProp: "<b>Nieuw adres toegevoegd!</b></br> Plaats deze marker op het lokaal",
        adresId: adres.id,
        animation: google.maps.Animation.DROP,
      });
      marker = markerAddEvents(marker, map);
      $scope.markers[adres.id] = (marker);
      openInfoWindow (map, marker);
    }

    /*
     * event groepseigenfuncties
     * ----------------------------------
     */

    $scope.addGroepseigenFunctie = function () {
      var newFunction = {
        id: 'tempFunctie' + tempId,
        beschrijving: null
      }
      tempId++;
      $scope.activegroup.groepseigenFuncties.push(newFunction);
    }

    $scope.wisGroepseigenFunctie = function () {
      // controle wis ik een nieuwe groepseigen functie
    }

    /*
    * Marker events
    * ----------------------------------------------------
    */

    // voegt alle nodige events toe aan een bepaalde marker
    var markerAddEvents = function (marker, map) {
      marker.addListener('click', function () {
        var infoWindow = new google.maps.InfoWindow({
          content: marker.infoProp,
          maxWidth: 200
        });
        infoWindow.open(map, this);
      });

      marker.addListener('dragend', function (evt) {
        angular.forEach($scope.activegroup.adres, function(value, key){
          if (value.id == marker.adresId) {
            if ($scope.activegroup.adres[key].positie == undefined) {
              $scope.activegroup.adres[key].positie = {};
            }
            $scope.activegroup.adres[key].positie.latitude = evt.latLng.lat();
            $scope.activegroup.adres[key].positie.longitude = evt.latLng.lng();

          }
        });
      });

      return marker;
    }
  }
})();

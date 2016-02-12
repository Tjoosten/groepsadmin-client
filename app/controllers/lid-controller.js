(function() {
  'use strict';

  angular
    .module('ga.lidcontroller', ['ga.services.alert', 'ga.services.dialog'])
    .controller('LidController', LidController);

  LidController.$inject = ['$scope', '$routeParams', 'RestService', 'AlertService','DialogService'];

  function LidController ($scope, $routeParams, RestService, AlertService, DialogService) {
    var sectie,
        patchObj;
    
    $scope.lid = RestService.Lid.get({id:$routeParams.id}, loadSuccess);
    
    function loadSuccess(data) {
      initModel();
      
      angular.forEach(['lid.persoonsgegevens', 'lid.email', 'lid.gebruikersnaam'], function(value, key) {
        $scope.$watch(value, setChanges, true);
      });
      
      // Permissies komen uit PATCH link object
      patchObj = $.grep($scope.lid.links, function(e){
        return e.method == "PATCH";
      })[0];
    }
    
    function initModel() {
      // Changes object bijhouden: enkel de gewijzigde properties meesturen met PATCH
      $scope.lid.changes = new Array();
      
      // Functiehistoriek weergeven/verbergen
      $scope.isFunctiesCollapsed = true;
      
      // Functies samenvoegen in één Array (Tijdelijk tot API update)
      var f = [];
      angular.forEach($scope.lid.functies, function(value) {
        f = f.concat(value);
      });
      $scope.lid.functies = f;
      
      // Alle actieve functies ophalen
      $scope.functieslijst = [];
      angular.forEach($scope.lid.functies, function(value, key) {
        var fn = RestService.Functie.get({functieId:value.functie});
        $scope.functieslijst[value.functie] = fn;
      });
      
      // Alle actieve groepen ophalen
      $scope.groepenlijst = [];
      angular.forEach($scope.lid.functies, function(value, key) {
        if($scope.groepenlijst[value.groep]) return;
        var gr = RestService.Groep.get({id:value.groep});
        $scope.groepenlijst[value.groep] = gr;
      });
    }

    function setChanges(newVal, oldVal, scope) {
      if (newVal == oldVal) return;

      sectie = this.exp.split(".").pop();
      if($scope.lid.changes.indexOf(sectie) < 0) {
        $scope.lid.changes.push(sectie);
      }
    }

    $scope.hasPermission = function(val) {
      if (patchObj) {
        return patchObj.secties.indexOf(val) > -1;
      }
    }

    $scope.opslaan = function() {
      $scope.lid.$update(function(response) {
        AlertService.add('success ', "Aanpassingen opgeslagen", 5000);
        initModel();
        //$scope.lid = response;
      });
    }

    $scope.schrap = function() {
    }

    $scope.nieuw = function() {
    }

    $scope.gezinslid = function() {
    }

    $scope.stopFunctie = function(functie) {
      var lid = {
        id: $scope.lid.id,  // Overbodig? id zit al in PATCH url
        functies: [
          {
            functie: functie.functie,
            groep: functie.groep,
            einde: new Date(),
            begin: functie.begin
          }
        ]
      }

      /*
      * bevestiging return functie
      * --------------------------------------
      */
      $scope.confirmstopFunctie = function(result){

        if(result){
          //set lid bevestiging
          lid.bevesteging = true;

          //send new request
          RestService.Lid.update({id:lid.id}, lid).$promise.then(
            function(response) {
              AlertService.add('success ', "Functie is geschrapt.", 5000);
              initModel();
              // TODO: update lid model (hier niet automatisch geüpdatet)

            },
            function(error) {
              AlertService.add('danger', "Error " + error.status + ". " + error.statusText);
            }
          );
        } else{
          AlertService.add('danger ', "Aanpassing niet doorgevoerd", 5000);
        }
      }

      
      RestService.Lid.update({id:lid.id}, lid).$promise.then(
        function(response) {

          //toon confirmvenster
          var currentFunctiName= $scope.functieslijst[functie.functie].beschrijving;
          DialogService.new("Bevestig","Weet u zeker dat u " + $scope.lid.persoonsgegevens.voornaam + " wilt schrappen als " + currentFunctiName + "?", $scope.confirmstopFunctie);

        },
        function(error) {
          AlertService.add('danger', "Error " + error.status + ". " + error.statusText);
        }
      );


    }

  }
})();

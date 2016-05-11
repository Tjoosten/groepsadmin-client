(function() {
  'use strict';

  angular
    .module('ga.services.http', ['ga.services.alert'])
    .factory('httpInterceptor', httpInterceptor)
    

  httpInterceptor.$inject = ['$q', 'AlertService'];
  
  function httpInterceptor($q, AlertService) {
    return {
      'request': function(config) {
        // add keycloak header if request goes to groepsadmin API
        if(config.url.lastIndexOf('/groepsadmin/rest-ga/', 0) === 0 ){
          console.log('API request');
          config.headers.Authorization = "Bearer mF_9.B5f-4.1JqM";
        }
        console.log(config);
        return config;
      },
      /*
      'requestError': function(rejection) {
        if (canRecover(rejection)) {
          return responseOrNewPromise
        }
        return $q.reject(rejection);
      },

      'response': function(response) {
        return response;
      },
      */
      'responseError': function(rejection) {
        console.log(rejection);
        if (!navigator.onLine || rejection.status == 0) {
          // Note: Browsers implement the NavigatorOnLine.onLine property differently.
          // See the docs: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine
          //console.log("Kon geen verbinding maken met de Groepsadministratie.")
          AlertService.add('danger', "Je hebt geen internetverbinding meer");
        }
        else if (rejection.status == 403) {
          AlertService.add('danger', "Je bent niet ingelogd");
        }
        else if (rejection.data) {
          // Tijdelijke server errors (Todo)
          AlertService.add('danger', "<b>" + rejection.data.title + "</b><br/>" + rejection.data.details[0].veld + " " + rejection.data.details[0].titel);
        }
        return $q.reject(rejection);
      }
    };
  }
})();

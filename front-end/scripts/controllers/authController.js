(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('AuthController', AuthController);

	angular
		.module('spherecastApp')
		.controller('AuthSocial', function($scope, $auth) {
	});

	function AuthController($scope, $auth, $state) {
		var vm = this;

		vm.login = function() {

			var credentials = {
				email: vm.email,
				password: vm.password
			}

			// Use Satellizer's $auth service to login
			$auth.login(credentials).then(function(data) {

				// If login is successful, redirect to the spheres state
				$state.go('spheres');
			}, function(error) {
				console.log(error);
			});
		}

		$scope.authenticateSocial = function(provider) {
			$auth.authenticate(provider);
		};


	}


})();
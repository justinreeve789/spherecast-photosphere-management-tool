(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('AuthController', AuthController);

	angular
		.module('spherecastApp')
		.controller('AuthSocial', function($scope, $auth) {
	});

	function AuthController($scope, $http, $auth, $state) {
		var vm = this;

		vm.login = function() {

			var credentials = {
				email: vm.email,
				password: vm.password,
			}

			// Use Satellizer's $auth service to login.
			$auth.login(credentials).then(function(data) {

				// If login is successful, retrieve the user object, and redirect to the /spheres state.
				$state.go('spheres');
			}, function(error) {
				console.log(error);
			});
		}

		$scope.authenticateSocial = function(provider) {
			$auth.authenticate(provider).then(function(data)
			{
				// Authentication successful, so go to /spheres.
				$state.go('spheres');
			}).catch(function(error)
			{
				console.log(error);
			});
		};

		vm.signup = function()
		{
			$http.post('api/user', { name: vm.name, email: vm.email, password: vm.password, verifypassword: vm.verifypassword }).success(function(user)
			{
				if (user.token)
				{
					var credentials =
					{
						email: vm.email,
						password: vm.password,
					}

					// Use Satellizer's $auth service to login.
					$auth.login(credentials).then(function(data)
					{
						// If login is successful, retrieve the user object, and redirect to the /spheres state.
						$state.go('spheres');
					}, function(error)
					{
						console.log(error);
					});
				}
			}).error(function(error)
			{
				console.log(error);
				vm.error = error;
			})
		};

		vm.getUser = function()
		{
			$http.get('api/user').success(function(user)
			{
				vm.user = user;
			}).error(function(error)
			{
				vm.error = error;
			});
		}
	}


})();
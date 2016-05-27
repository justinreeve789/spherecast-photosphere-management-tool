(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('AuthController', AuthController);

	function AuthController($scope, $rootScope, $http, $auth, $state, $location, AuthenticatedUser) {
/*
		// If the user is already logged in, log out.
		if ($rootScope.authToken || localStorage.getItem('authenticated_user') != null)
		{
			$location.path('/logout');
		}
*/
		var vm = this;

		vm.login = function() {

			var credentials = {
				email: vm.email,
				password: vm.password,
			};

			// Use Satellizer's $auth service to login.
			$auth.login(credentials).then(function(data)
			{
				// Authentication successful, so redirect to /spheres.
				$rootScope.authToken = $auth.getToken();
				var authUserGet = AuthenticatedUser.get();
				authUserGet.then(function(authUser)
				{
					if (authUser.check_imports == 1)
						$state.go('import');
					else
						$state.go('spheres');
				});
			}, function(error)
			{
				vm.error = error.data;
			});
		}

		$scope.authenticateSocial = function(provider) {
			$auth.authenticate(provider).then(function(data)
			{
				// Authentication successful, so redirect to /spheres.
				$rootScope.authToken = $auth.getToken();
				var authUserGet = AuthenticatedUser.get();
				authUserGet.then(function(authUser)
				{
					if (authUser.check_imports == 1)
						$state.go('import');
					else
						$state.go('spheres');
				});
			}).catch(function(error)
			{
//				console.log(error);
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
						var authUserGet = AuthenticatedUser.get();
						authUserGet.then(function(authUser)
						{
							if (authUser.check_imports_at_login == 1)
								$state.go('import');
							else
								$state.go('spheres');
						});

					}, function(error)
					{
						vm.error = error;
//						console.log(error);
					});
				}
			}).error(function(error)
			{
				vm.error = error;
//				console.log(error);
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

		vm.resetPassword = function()
		{
			$http.post('api/user/resetpassword', { email: vm.email }).success(function(data)
			{
				vm.message = data;
				console.log(data);
			}).error(function(error)
			{
				vm.error = error;
				console.log(error);
			});
		}
	}
})();
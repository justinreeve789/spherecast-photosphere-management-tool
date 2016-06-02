(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('PasswordResetController', PasswordResetController);

	function PasswordResetController($scope, $rootScope, $http, $auth, $state, $location, AuthenticatedUser)
	{
		$rootScope.pageLoaded = false;
		var vm = this;
		var params = $location.search();
		if (typeof params.token !== undefined)
		{
			$http.post('api/user/processresetpassword', { token: params.token }).success(function(data)
			{
				$rootScope.pageLoaded = true;
				vm.message = data;
			}).error(function(error)
			{
				$rootScope.pageLoaded = true;
				vm.error = error;
			})
		}
	}
})();
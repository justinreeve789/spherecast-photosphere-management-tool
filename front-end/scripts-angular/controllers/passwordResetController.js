(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('PasswordResetController', PasswordResetController);

	function PasswordResetController($scope, $rootScope, $http, $auth, $state, $location, AuthenticatedUser)
	{
		var vm = this;
		var params = $location.search();
		if (typeof params.token !== undefined)
		{
			$http.post('api/user/processresetpassword', { token: token }).success(function(data)
			{
				console.log(data);
			}).error(function(error)
			{
				vm.error = error;
				console.log(error);
			})
		}
	}
})();
(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('ProfileController', ProfileController);

	function ProfileController($scope, $rootScope, $http, $location, AuthenticatedUser) {
		var vm = this;

		vm.name = $rootScope.authenticatedUser.name;
		vm.email = $rootScope.authenticatedUser.email;

		vm.save = function()
		{
			vm.error = {};
			vm.message = {};

			if (vm.name != null && vm.name.trim() == '')
			{
				vm.error.error_name = 'Please enter a name.';
				return;
			}

			if (vm.email != null && vm.email.trim() == '')
			{
				vm.error.error_email = 'Please enter an email address.';
				return;
			}
/*
			if (vm.oldpassword != null || vm.newpassword != null || vm.verifypassword != null)
			{
				if (vm.oldpassword == null || vm.oldpassword == '')
					vm.error.error_oldpassword = 'Please enter your current password.';

				if (vm.newpassword == null || vm.newpassword == '')
					vm.error.error_newpassword = 'Please enter a new password.';

				if (vm.verifypassword == null || vm.verifypassword == '')
				{
					vm.error.error_verifypassword = 'Please verify your new password.';
					return;
				}
				
				if (vm.newpassword != vm.verifypassword)
				{
					vm.error.error_verifypassword = 'Your passwords don\'t match. Please try again.';
					return;
				}
				return;
			}
*/
			$http.post('api/user/edit', { name: vm.name, email: vm.email, oldpassword: vm.oldpassword, newpassword: vm.newpassword, verifypassword: vm.verifypassword }).success(function(data)
			{
				vm.message = data;
				AuthenticatedUser.refresh();
			}).error(function(error)
			{
				vm.error = error;
				console.log(error);
			})			
		}
	}


})();
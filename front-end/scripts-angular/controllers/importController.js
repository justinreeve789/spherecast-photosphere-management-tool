'use strict';

angular
	.module('spherecastApp')
	.controller('ImportController', ImportController);

function ImportController($scope, $rootScope, $http, $state, AuthenticatedUser)
{
	var vm = this;

	vm.items;
	vm.error;
	vm.authenticatedUser = $rootScope.authenticatedUser;

	vm.importProcessed = false;

	// Don't continue if we're not in the correct site.
	if ($rootScope.site.id != 1)
	{
		console.log($rootScope.site.id);
	}

	vm.getSystemImportedMedia = function()
	{
		$rootScope.pageLoaded = false;

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users.
		$http.get('api/media/list/system').success(function(data) {
			vm.items = data.media;
			vm.items_shown = data.media_shown;
			vm.items_count = data.media_count;

			// If there's no items, turn off the check_imports_at_login flag and redirect to /spheres.
			if (vm.items_count == 0)
			{
				$http.post('api/user/disablecheckimports', { flag: '-1' }).success(function(data)
				{
					AuthenticatedUser.refresh();
					$state.go('spheres');
				}).error(function(error)
				{
					$state.go('spheres');
				});
			}
			else
				$rootScope.pageLoaded = true;
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}

	vm.import = function()
	{
		vm.importProcessing = true;
		$http.get('api/media/assign/system').success(function(data) {
			vm.importProcessing = false;
			vm.message = data;
			vm.items = [];
			vm.importProcessed = true;
			AuthenticatedUser.refresh();
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}

	vm.forget = function()
	{
		$http.post('api/user/disablecheckimports', { flag: '0' }).success(function(data)
		{
			AuthenticatedUser.refresh();
			$state.go('spheres');
		}).error(function(error)
		{
			$state.go('spheres');
		});
	}

	vm.getSystemImportedMedia();
}
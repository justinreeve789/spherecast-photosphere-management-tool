'use strict';

angular
	.module('spherecastApp')
	.controller('ImportController', ImportController);

function ImportController($scope, $rootScope, $http)
{
	var vm = this;

	vm.items;
	vm.error;

	vm.importProcessed = false;

	vm.getSystemImportedMedia = function()
	{
		$rootScope.pageLoaded = false;

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users.
		$http.get('api/media/list/system').success(function(data) {
			vm.items = data.media;
			vm.items_shown = data.media_shown;
			vm.items_count = data.media_count;
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
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}

	vm.forget = function()
	{
	}

	vm.getSystemImportedMedia();
}
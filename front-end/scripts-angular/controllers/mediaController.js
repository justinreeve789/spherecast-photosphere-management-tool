'use strict';

angular
	.module('spherecastApp')
	.controller('MediaController', MediaController);

function MediaController($scope, $rootScope, $http) {

	var vm = this;

	vm.items;
	vm.error;

	vm.getMedia = function() {

		$rootScope.pageLoaded = false;

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users
		$http.get('api/media/list').success(function(items) {
			vm.items = items;
			$rootScope.pageLoaded = true;
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}
	
	vm.getMedia();
//	console.log($rootScope.authenticatedUser);

	$scope.edit = function(item) {
		$scope.pageEditing = true;
		$scope.currentItem = item;
	}

	$scope.cancel = function(item) {
		$scope.pageEditing = false;
		$scope.currentItem = null;
	}

	$scope.close = function(item) {
		$scope.pageEditing = false;
		$scope.currentItem = null;
	}

	$scope.save = function(item) {
		var data = JSON.stringify({ id: item.id, title: item.title, code: item.code, tags: item.tags });
		$http.post('api/media', data).success(function(item)
		{
		}).error(function(error) {
			vm.error = error;
//			console.log(vm.error);
		});
	}
}
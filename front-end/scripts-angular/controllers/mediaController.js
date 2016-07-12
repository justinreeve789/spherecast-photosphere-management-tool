'use strict';

angular
	.module('spherecastApp')
	.controller('MediaController', ['$scope', '$rootScope', '$http', '$window', MediaController]);

function MediaController($scope, $rootScope, $http, $window) {

	var vm = this;

	vm.items;
	vm.error;
	vm.currentItem;
	vm.originalItem;

	$scope.formSaving = false;

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

	$scope.view = function(item) {
		$window.open('/' + item.code, '_blank');
	}

	$scope.edit = function(item, $event) {
		$event.stopPropagation();					// Don't allow $scope.view() to run, since it's on the parent.
		$scope.pageEditing = true;
		vm.originalItem = angular.copy(item);
		$scope.formItem = item;
	}

	$scope.cancel = function(item) {
		$scope.pageEditing = false;
		$scope.formItem = null;
	}

	$scope.close = function(item) {
		$scope.pageEditing = false;
		$scope.formItem = null;
	}

	$scope.save = function(item) {
		var data = JSON.stringify({ id: item.id, title: item.title, code: item.code, tags: item.tags });
		$scope.formSaving = true;
		$http.post('api/media', data).success(function(response)
		{
			// Update the items on $scope.currentItem, which references the item in the grid.
			// Don't update the image, however.
			$scope.formSaving = false;
			$scope.close();
		}).error(function(error) {
			$scope.formSaving = false;
			item = vm.originalItem;
			vm.error = error;
//			console.log(vm.error);
		});
	}
}
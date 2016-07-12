'use strict';

angular
	.module('spherecastApp')
	.controller('MediaController', ['$scope', '$rootScope', '$http', '$window', MediaController]);

function MediaController($scope, $rootScope, $http, $window) {

	var vm = this;

	vm.items;
	vm.error;
	vm.currentItem;
	vm.currentItemIndex;
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

	$scope.edit = function(item, $index, $event) {
		$event.stopPropagation();					// Don't allow $scope.view() to run, since it's on the parent.
		$scope.pageEditing = true;
		vm.currentItem = item;
		$scope.formItem = angular.copy(item);
		$scope.itemIndex = $index;
	}

	$scope.cancel = function(item) {
		$scope.pageEditing = false;
		$scope.formItem = null;
	}
/*
	$scope.close = function(item) {
		$scope.pageEditing = false;
		$scope.formItem = null;
	}
*/
	$scope.save = function(item) {
		var data = JSON.stringify({ id: item.id, title: item.title, code: item.code, tags: item.tags });
		$scope.formSaving = true;
		$http.post('api/media', data).success(function(response)
		{
			// Update the items on $scope.currentItem, which references the item in the grid.
			// Don't update the image, however.
			vm.error = null;
			vm.items[$scope.itemIndex] = $scope.formItem;
			$scope.formSaving = false;
			$scope.cancel();
//			vm.message = response;		// No need for this since we're closing the panel.
		}).error(function(error) {
			$scope.formSaving = false;
			vm.error = error;
		});
	}

	$scope.delete = function(item) {
		$scope.showDeleteConfirmation = true;
	}

	$scope.confirmDelete = function(item) {
//		var data = JSON.stringify({ id: item.id });
		$scope.formDeleting = true;
		$http.delete('api/media/' + item.id).success(function(response)
		{
			// Update the items on $scope.currentItem, which references the item in the grid.
			// Don't update the image, however.
			vm.error = null;
			$scope.formDeleting = false;
			$scope.cancel();
//			vm.message = response;		// No need for this since we're closing the panel.
		}).error(function(error) {
			$scope.formSaving = false;
			vm.error = error;
		});
	}
}
'use strict';

angular
	.module('spherecastApp')
	.controller('MediaController', MediaController);

function MediaController($scope, $rootScope, $http) {

	var vm = this;

	vm.items;
	vm.error;

	vm.getMedia = function() {

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users
		$http.get('api/media/list').success(function(items) {
			vm.items = items;
		}).error(function(error) {
			vm.error = error;
		});
	}

	vm.getMedia();

	$scope.edit = function(item) {
		$scope.pageEditing = true;
		$scope.currentItem = item;
	}
}
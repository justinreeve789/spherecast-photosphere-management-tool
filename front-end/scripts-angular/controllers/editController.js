'use strict';

angular
	.module('spherecastApp')
	.controller('EditController', function($scope)
{
	$scope.editSphere = function()
	{
	};

	$scope.ok = function()
	{
		$scope.showModal = false;
	};

	$scope.cancel = function()
	{
		$scope.showModal = false;
	};
});
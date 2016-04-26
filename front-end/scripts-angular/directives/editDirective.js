'use strict';

angular
	.module('spherecastApp')
	.directive('editSphere', ['$animate', function()
{
	return {
		restrict: 'EA',
		controller: function($scope)
		{
			console.log($scope.currentItem);
		},
		templateUrl: '/views/editView.html',
		replace: false,
		scope: true,
	}
}]);
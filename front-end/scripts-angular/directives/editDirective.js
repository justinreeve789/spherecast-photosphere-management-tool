'use strict';

angular
	.module('spherecastApp')
	.directive('editSphere', ['$animate', function()
{
	return {
		restrict: 'EA',
		controller: function($scope)
		{
		},
		templateUrl: '/partials/editmedia.html',
		replace: false,
		scope: true,
	}
}]);
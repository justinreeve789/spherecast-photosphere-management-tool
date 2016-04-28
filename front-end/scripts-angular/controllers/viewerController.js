'use strict';

angular
	.module('spherecastApp')
	.controller('ViewerController', ['$scope', '$http', '$state', '$stateParams', '$location', function($scope, $http, $state, $stateParams, $location)
{
	var vm = this;

	vm.getMediaItem = function(code)
	{
		$http.get('api/media/get/' + code).success(function(item) {
			return item;
		}).error(function(error) {
			vm.error = error;
		});
	}

	// Check that the path passed corresponds to a shortname on the site.
	var noMedia = true;
	if (typeof $stateParams.code !== undefined)
	{
		var code = $stateParams.code;
		if (code !== null && code != '')
		{
//			var item = vm.getMediaItem(code);
			$http.get('api/media/get/' + code).success(function(item)
			{
				if (typeof item !== 'undefined' && item != '')
				{
					console.log('change');
					noMedia = false;
				}
				else
				{
					$state.go('upload');
				}
			}).error(function(error) {
				vm.error = error;
				$state.go('upload');
			});
		}
		else
		{
			$state.go('upload');
		}
	}

	console.log(noMedia);
	if (noMedia == true)
	{
	}
}]);
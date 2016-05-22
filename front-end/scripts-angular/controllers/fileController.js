angular
	.module('spherecastApp')
	.controller('SingleFileController', ['$scope', '$http', '$location', 'Upload', function($scope, $http, $location, Upload)
{
	var vm = this;

	// Check for URL parameters.
	var urlParams = $location.search();
	if (urlParams.url)
	{
	}

	$scope.upload = function(file)
	{
		$scope.fileUploading = true;
		$scope.uploadProgressPercentage = 0;
		$scope.uploadProgressString = '';

		$scope.uploadFile = Upload.upload(
		{
			url: '/api/upload',
			data: { mediaFile: file },
		});
		
		$scope.uploadFile.then(function(response)
		{
			if (typeof response.data !== 'undefined')
			{
				if (typeof response.data.code !== 'undefined')
				{
					var redirectUrl = '/' + response.data.code;
//					console.log(redirectUrl);
					window.location = redirectUrl;
//					$scope.fileUploading = false;
				}
			}
//			$scope.fileUploading = false;
		}, function(error)
		{
//			console.log(error);
			$scope.fileUploading = false;
			$scope.uploadProgressPercentage = 0;
			$scope.uploadProgressString = '';
		}, function(evt)
		{
			$scope.fileUploading = true;
			$scope.uploadProgressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			if ($scope.uploadProgressPercentage < 100)
			{
				$scope.uploadProgressString = $scope.uploadProgressPercentage + '%';
			}
			else
			{
				$scope.uploadProgressString = 'Processing...';
			}
//			console.log($scope.uploadProgressString);
		})
	};

	$scope.cancel = function()
	{
//		$scope.uploadFile.abort();
//		$scope.fileUploading = false;
	};

	$scope.import = function()
	{
		$scope.fileImporting = true;
		$scope.importProgressPercentage = 100;
		$scope.importProgressString = 'Processing...';

		var data = JSON.stringify({ url: $scope.url });
		$http.post('/api/import', data).success(function(item)
		{
//			console.log(item);
			if (typeof item.code !== 'undefined')
			{
				var redirectUrl = '/' + item.code;
				window.location = redirectUrl;
			}
			else
			{
				$scope.url = '';
				$scope.importProgressPercentage = 100;
				$scope.importProgressString = 'Failed!';
			}
		}).error(function(error) {
			vm.error = error;
//			console.log(vm.error);
			$scope.url = '';
			$scope.importProgressPercentage = 100;
			$scope.importProgressString = 'Failed!';
		});
	};
}]);
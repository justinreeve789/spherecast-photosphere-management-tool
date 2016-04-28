angular
	.module('spherecastApp')
	.controller('SingleFileController', ['$scope', '$location', 'Upload', function($scope, $location, Upload)
{
	$scope.upload = function(file)
	{
		$scope.fileUploading = true;

		Upload.upload({
			url: '/api/upload',
			data: { mediaFile: file },
		}).then(function(response)
		{
			if (typeof response.data !== undefined)
			{
				if (typeof response.data.code !== undefined)
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
			console.log(error);
			$scope.fileUploading = false;
		}, function(evt)
		{
			$scope.uploadProgressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			if ($scope.uploadProgressPercentage < 100)
			{
				$scope.uploadProgressString = $scope.uploadProgressPercentage + '%';
			}
			else
			{
				$scope.uploadProgressString = 'Processing...';
			}
			console.log($scope.uploadProgressString);
		})
	};

	$scope.cancel = function(file)
	{
		$scope.fileUploading = status;
	}
}]);
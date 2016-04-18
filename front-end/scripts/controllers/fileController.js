angular
	.module('spherecastApp')
	.controller('FileController', ['$scope', 'fileUpload', function($scope, fileUpload)
	{
		$scope.uploadFile = function()
		{
			var file = $scope.mediaFile;
			var uploadUrl = "/api/upload";
			fileUpload.uploadFileToUrl(file, uploadUrl);
		};
	}]);
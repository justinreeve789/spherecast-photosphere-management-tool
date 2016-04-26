angular
	.module('spherecastApp')
	.controller('MultiFileController', ['$scope', 'fileUpload', function($scope, fileUpload)
	{
		$scope.uploadFile = function()
		{
			var file = $scope.mediaFile;
			var uploadUrl = "/api/upload";
			fileUpload.uploadFileToUrl(file, uploadUrl);
		};
	}]);
/*
angular
	.module('spherecastApp', ['ngFileUpload'])
	.controller('SingleFileController', ['$scope', 'Upload', '$timeout', function($scope, Upload, $timeout)
	{
		$scope.uploadFiles = function(file, errFiles)
		{
			$scope.f = file;
			$scope.errFile = errFiles && errFiles[0];
			if (file)
			{
				console.log(file);
				file.upload = Upload.upload(
				{
					url: '/api/upload',
					data:
					{
						mediaFile: file
					}
				});
				file.upload.then(function(response)
				{
					$timeout(function()
					{
						file.result = response.data;
					});
				}, function(response)
				{
					if (response.status > 0) $scope.errorMsg = response.status + ': ' +
						response.data;
				}, function(evt)
				{
					file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
				});
			}
		}
	}
]);
*/

angular
	.module('spherecastApp')
	.controller('MediaController', ['$scope', '$http', '$routeParams', '$upload', function($scope, $http, $routeParams, $upload)
{
	$scope.$watch('files', function()
	{
//		console.log($scope.activeProject);
//		console.log($scope.activeScene);
		if (typeof $scope.files !== 'undefined')
		{
			for (var f = 0; f < $scope.files.length; f++)
			{
				var file = $scope.files[f];
				$scope.upload = $upload.upload(
				{
					method: 'POST',
					url: '/api/media',
					file: file,
					fields: {'projectId': $scope.projectId, 'sceneId': $scope.sceneId, 'sessionId': ''}
				}).progress(function(evt)
				{
					console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :'+ evt.config.file.name);
				}).success(function(data, status, headers, config)
				{
					console.log('file ' + config.file.name + ' is uploaded successfully. Response: ' + data);
				});
			}
		}
	});
}]);
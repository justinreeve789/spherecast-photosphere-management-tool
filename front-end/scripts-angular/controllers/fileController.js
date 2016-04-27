angular
	.module('spherecastApp')
	.controller('SingleFileController', ['$scope', 'Upload', function($scope, Upload)
{
	$scope.upload = function(file)
	{
		Upload.upload({
			url: '/api/upload',
			data: { mediaFile: file },
		}).then(function(data)
		{
			console.log(data);
		}, function(error)
		{
			console.log(error);
		}, function(evt)
		{
			var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			console.log('Progress: ' + progressPercentage + '% ' + evt.config.data.mediaFile);
		})
	};
}]);
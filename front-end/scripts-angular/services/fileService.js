angular
	.module('spherecastApp').service('fileUpload', ['$http', function($http)
	{
		this.uploadFileToUrl = function(file, uploadUrl)
		{
			var fd = new FormData();
			fd.append('mediaFile', file);
			$http.post(uploadUrl, fd,
			{
				transformRequest: angular.identity,
				headers:
				{
					'Content-Type': undefined
				}
			})
			.progress(function(evt)
			{
				console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :'+ evt.config.file.name);
			})
			.success(function(data)
			{
				console.log(data);
			})
			.error(function(data)
			{
				console.log(data);
			});
		}
	}]);
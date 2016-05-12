'use strict';

angular
	.module('spherecastApp')
	.controller('ViewerController', ['$scope', '$rootScope', '$http', '$state', '$stateParams', '$location', 'Project', function($scope, $rootScope, $http, $state, $stateParams, $location, Project)
{
	var vm = this;
	$rootScope.fullscreenViewer = true;

	$scope.showShareBlock = false;

//	if (Modernizr.hasEvent('deviceOrientation'))
//	if (window.DeviceOrientationEvent || window.OrientationEvent || typeof window.onorientationchange != 'undefined')
	// TODO: We may need to distinguish between phones and tablets, since tablets may still require
	// a click before playing media, but we don't necessarily want to load it in stereoscopic mode.
	if (isMobileBrowser() == true)
	{
		// TODO: Check if a screen tap has already occurred at some point. This would typically only
		// be true if we're using the editor.
		$scope.isMobile = true;
		$scope.requireTapToContinue = true;
		$scope.vrMode = true;
	}
	else
	{
		$scope.isMobile = false;
		$scope.vrMode = false;
	}

	// Check that the path passed corresponds to a shortname on the site.
	if (typeof $stateParams.code !== undefined)
	{
		var code = $stateParams.code;
		if (code !== null && code != '')
		{
//			$rootScope.pageLoaded = false;
			var project = Project.getMediaProject(code);
			project.then(function(activeProject)
			{
				$rootScope.pageLoaded = true;
				if (activeProject)
				{
					// View the directive.
					$scope.activeProject = activeProject;
					$scope.projectLoaded = true;
					$scope.showLoadingScreen = false;
					$scope.embedded = true;
					$scope.canvasWidth = '100%';
					$scope.canvasHeight = '100%';
					$scope.dofillcontainer = true;
					$scope.scale = 1;
					$scope.vrMode = true;
					$scope.requireTapToContinue = false;
					$scope.windowWidth = window.innerWidth;
					$scope.windowHeight = window.innerHeight;
				}
			});

			project.catch(function(error)
			{
				vm.error = error.data;
				$scope.error = true;
				console.log($scope.error)
			});
		}
		else
		{
			$state.go('upload');
		}
	}

	$scope.selectShareText = function($event)
	{
		$event.target.select();
	};

	// TODO: Use a hidden button as the trigger for fullscreen, and process it in a $scope.watch().
	$scope.toggleFullscreen = function()
	{
		$scope.goFullscreen = $scope.goFullscreen === false ? true : false;
	}

	// TODO: Determine the best file to deliver depending on device, bandwidth, connection speed, current cache,
	// and user preferences.
	$scope.getFileByMediaId = function(mediaId)
	{
		if (typeof $scope.activeProject.assets.media[mediaId] !== 'undefined')
		{
			var media = $scope.activeProject.assets.media[mediaId];
			var fileIdHigh = media.fileIdHigh;
			var mediaFile = media.files[fileIdHigh];
//			console.log(mediaFile);
			return mediaFile;
		}
		return null;
	};
}]);
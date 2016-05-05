'use strict';

angular.module('spherecastApp')
  .directive('spherecastViewer', function() {
    return {
	  restrict: '',
	  scope: false,
	  link: function(scope, element, attrs)
	  {
		var orientationAlpha = 0, orientationBeta = 0, orientationGamma = 0, orientationAbs = 0;
		var orientationX = 0, orientationY = 0, orientationZ = 0, orientationAbs = 0;
		var orientationCompass = '';

		var currentAnimationFrameId;

        var camera,
        	scene,
        	renderer, shadowMesh, icosahedron, light,
			mouseX = 0, mouseY = 0,
			contW = (scope.fillcontainer) ? element[0].clientWidth : scope.width,
			contH = scope.height,
			windowHalfX = contW / 2,
			windowHalfY = contH / 2,
			materials = {};
		var cameraSphereIntersection;
		var controls, orbitControls, deviceOrientationControls;
		var stereoEffect;
		var domElement;

		var activeProject;
		var activeScene;

		// Initialize the viewer.
		scope.init = function()
		{
			// Don't continue if the scope doesn't have an activeProject yet.
			if (typeof scope.activeProject === 'undefined')
				return;

			var clock = new THREE.Clock();		// TODO: Use the clock to count hotspot durations.
			clock.start();

			// Primary scene
			scene = new THREE.Scene();

			// Renderer
//			renderer = new THREE.WebGLRenderer({antialias: true});
			renderer = new THREE.WebGLRenderer();
//			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setClearColor(0x000000);
			renderer.setSize(contW, contH);
			renderer.autoClear = false;
			domElement = renderer.domElement;

			// Main camera (perspective)
			contW = 640;
			contH = 480;
			camera = new THREE.PerspectiveCamera(90, (contW / 2) / contH, 0.001, 1000);
			camera.position.set(0, 0, 0);
			scene.add(camera);

			// Controls
			orbitControls = new THREE.OrbitControls(camera, domElement);
//			controls.rotateUp(Math.PI / 4);
//			controls.rotateLeft(-270 * Math.PI / 180);
			orbitControls.target.set(
				camera.position.x + 0.1,
				camera.position.y,
				camera.position.z
			);
			orbitControls.update();

			// Crosshairs HUD
//			if (scope.activeProject.showCrosshairs == true)
//				scope.crosshairs();

//			scope.setInitialVariables();

//			scope.toggleMode();

			// TODO: Activate fullscreen on a screen click for mobile devices, and only on a single screen at
			// the beginning of the spherecast. Because of how Angular works (/#/), we may actually not even
			// need to do this over again if they jump between spherecasts.
			domElement.addEventListener('click', function()
			{
				if (!scope.isFullScreen()) {
					scope.fullscreen();
				}
			});

			window.addEventListener('resize', scope.onWindowResize, false);

			activeProject = scope.activeProject;
			scope.loadNewScene(activeProject.startScene);
		};

		// This is intended to replace jumpToScene().
		scope.loadNewScene = function(sceneId)
		{
			// Retrieve the scene from project.
			if (typeof activeProject.scenes[sceneId] !== 'undefined')
			{
				// TODO: Make sure the new scene's assets are loaded. While the user is in the previous scene, they should have
				// spent some time loading, but we'll need to show the loading screen just in case they aren't.

				// A new scene was actually found, so we can remove the current one's background and add
				// the new one, if one exists (could be a blank screen).
				if (activeScene && activeScene.background)
				{
					scene.remove(activeScene.background);
	
					// Dispose of the old background.
					activeScene.background.geometry.dispose();
					activeScene.background.material.dispose();
	
					if (typeof activeScene.backgroundTexture !== 'undefined')
						activeScene.backgroundTexture.dispose();
				}

				activeScene = activeProject.scenes[sceneId];
				activeScene.assets = {};

				// Load the scene background, using the media id. Reference the project-level assets.
				if (typeof activeScene.backgroundMediaId == 'undefined' || activeScene.backgroundMediaId == null)
				{
					// No background media is present, but we still need a sphere for raycasting. Load a blank photosphere.
					var backgroundGeometry = new THREE.SphereGeometry(100, 32, 32);
					var backgroundMaterial = new THREE.MeshBasicMaterial({
							color: 0X000000,
							side: THREE.DoubleSide,
					});
					activeScene.assets.background = new THREE.Mesh(
						backgroundGeometry, backgroundMaterial
					);
					activeScene.assets.background.material.side = THREE.DoubleSide;
					activeScene.assets.background.scale.x = -1;
					activeScene.assets.backgroundGeometry = backgroundGeometry;
					activeScene.assets.backgroundMaterial = backgroundMaterial;
					scene.add(activeScene.assets.background);
				}
				else
				{
					// Retrieve the media object.
					if (activeProject.assets.media[activeScene.backgroundMediaId].type == 'backgroundimage')
					{
						var backgroundFile = scope.getFileByMediaId(activeScene.backgroundMediaId);

						// TODO: Look at the width and height of the background image to determine how to map the texture.
						// If it's a 2:1 aspect ratio, assume it's an equirectangular photosphere. If wider than
						// 2:1, assume it's a panorama, and add enough blank space on the top and bottom to compensate.

						// It's not clear if three.js is capable of mapping only on a certain part of the sphere. We
						// may just turn the background into a "child" of the main background image uploaded, and handle
						// this in the creation utility itself so it has the proper amount of blank space around it for
						// a 2:1 aspect ratio.

						if (backgroundFile)
						{
							var backgroundTexture = THREE.ImageUtils.loadTexture(backgroundFile.filepath);
							backgroundTexture.generateMipmaps = false;
							backgroundTexture.minFilter = THREE.LinearFilter;
							backgroundTexture.magFilter = THREE.LinearFilter;

							// TODO: Do we need to make sure the sphere is only created once when the viewer loads?
							var backgroundGeometry = new THREE.SphereGeometry(100, 32, 32);
							var backgroundMaterial = new THREE.MeshBasicMaterial({
									map: backgroundTexture,
									side: THREE.DoubleSide,
							});
							activeScene.assets.backgroundGeometry = backgroundGeometry;
							activeScene.assets.backgroundMaterial = backgroundMaterial;

							activeScene.assets.background = new THREE.Mesh(
								backgroundGeometry, backgroundMaterial
							);
							activeScene.assets.background.material.side = THREE.DoubleSide;
							activeScene.assets.background.scale.x = -1;
							scene.add(activeScene.assets.background);
							activeScene.assets.backgroundTexture = backgroundTexture;
						}
					}
				}
			}
		};

		// TODO: Determine the best file to deliver depending on device, bandwidth, connection speed, current cache,
		// and user preferences.
		scope.getFileByMediaId = function(mediaId)
		{
			if (typeof activeProject.assets.media[mediaId] !== 'undefined')
			{
				var media = activeProject.assets.media[mediaId];
				var fileIdHigh = media.fileIdHigh;
				var mediaFile = media.files[fileIdHigh];
				console.log(mediaFile);
				return mediaFile;
			}
			return null;
		};

		scope.init();

		scope.animate = function(dt)
		{
			currentAnimationFrameId = requestAnimationFrame(scope.animate);
//			camera.updateProjectionMatrix();
//			controls.update(clock.getDelta());
			if (orbitControls.enabled == true)
			{
				orbitControls.update(clock.getDelta());
			}
			else
			{
				if (typeof activeScene.northRotationOffset !== 'undefined')
				{
					deviceOrientationControls.update(clock.getDelta(), activeScene.northRotationOffset);
				}
				else
					deviceOrientationControls.update(clock.getDelta());
			}
			scope.render(clock.getDelta());
			scope.update();
		};

		// We'll want to render anything attached to a camera here, since we'll need to attach it
		// differently if VR mode is enabled.
		scope.render = function()
		{
			renderer.clear();

			// TODO: Add billboards to scene for hotspot labels that always face the camera.
			// See http://stackoverflow.com/questions/16001208/how-can-i-make-my-text-labels-face-the-camera-at-all-times-perhaps-using-sprite

			// Render the view.
			if (scope.vrMode == true)
			{
				stereoEffect.render(scene, camera);
				stereoEffect.clearDepth();
//				stereoEffect.render(overlayScene, cameraOrtho);
			}
			else
			{
				renderer.render(scene, camera);
				renderer.clearDepth();
//				renderer.render(overlayScene, cameraOrtho);
			}
		};

		scope.update = function()
		{
		};
	  }
	}
});
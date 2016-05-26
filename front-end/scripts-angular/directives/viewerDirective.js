'use strict';

angular.module('spherecastApp')
	.directive('spherecastViewer', function()
{
	return {
		restrict: '',
		scope: false,
		link: function(scope, element, attrs)
		{
		    var scene, camera, renderer, stereoEffect, domElement
		    var activeProject, activeScene;
			var controls, orbitControls, deviceOrientationControls;
			var clock;

		    scope.init = function()
		    {
		        scene = new THREE.Scene();
				clock = new THREE.Clock();		// TODO: Use the clock to count hotspot durations.

		        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
		        camera.position.set(0, 0, 0);

				// Normal renderer
		        renderer = new THREE.WebGLRenderer();

				// Stereoscopic effect
				stereoEffect = new THREE.StereoEffect(renderer);
				stereoEffect.separation = -6.2;
				stereoEffect.setSize(window.innerWidth / 2, window.innerHeight);

				// Size renderer.
		        domElement = renderer.domElement;
		        renderer.setSize(window.innerWidth, window.innerHeight);
		        element[0].appendChild(domElement);

				// Check for DeviceOrientationControls.
				scope.setControls();

				// Orbit controls are enabled no matter which mode we're using.
				orbitControls = new THREE.OrbitControls(camera, domElement);
				orbitControls.target.set(
					camera.position.x + 0.1,
					camera.position.y,
					camera.position.z
				);
				orbitControls.update(clock.getDelta());
				camera.updateProjectionMatrix();

				// Activate renderer mode
				scope.toggleMode();

				window.addEventListener('resize', scope.resizeCanvas, false);
				window.addEventListener('orientationchange', scope.resizeCanvas, false);

		        activeProject = scope.activeProject;
		        scope.loadNewScene(activeProject.startScene);
		    };



		    scope.animate = function()
		    {
		        requestAnimationFrame(scope.animate);

//				if (orbitControls.enabled == true)
//				{
//					orbitControls.update(clock.getDelta());
//				}
				orbitControls.update(clock.getDelta());

				if (typeof deviceOrientationControls !== 'undefined' && typeof deviceOrientationControls.enabled !== 'undefined')
				{
					if (deviceOrientationControls.enabled == true)
					{
						deviceOrientationControls.update(clock.getDelta());
					}
				}

				scope.render();
		    };



			scope.update = function()
			{
			};



			scope.setControls = function()
			{
				window.addEventListener('deviceorientation', scope.setOrientationControls, true);
			};



			scope.setOrientationControls = function(e)
			{
				if (!e.alpha)
				{
					// Let's set the VR mode to false since we know we can't use DeviceOrientationControls.
//					console.log('Viewer: ' + scope.vrMode);
//					viewer.vrMode = false;
					return;
				}

				if (typeof deviceOrientationControls === 'undefined' || !deviceOrientationControls)
				{
					deviceOrientationControls = new THREE.DeviceOrientationControls(camera);
					deviceOrientationControls.connect(clock.getDelta());
				}
				deviceOrientationControls.update();
				deviceOrientationControls.enabled = true;
				window.removeEventListener('deviceorientation', scope.setOrientationControls, true);
			}




			// We don't actually get rid of the stereoEffect (not sure it can be done), but we just
			// render the view differently in render(). We have to make sure to reset the renderer
			// size when we toggle back to standard mode, since StereoEffect changes that.
			scope.toggleMode = function()
			{
				if (scope.vrMode == true)
				{
					camera.fov = 90;
					camera.updateProjectionMatrix();

					// Active the DeviceOrientation controls.
//					window.addEventListener('deviceorientation', scope.setOrientationControls, true);
				}
				else
				{
					renderer.setSize(window.innerWidth, window.innerHeight);
					camera.fov = 70;
					camera.updateProjectionMatrix();

					// Deactivate the DeviceOrientation controls.
					if (typeof deviceOrientationControls !== 'undefined' && deviceOrientationControls)
						deviceOrientationControls.enabled = false;
				}
				scope.resizeCanvas();
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

						if (typeof activeScene.assets.backgroundTexture !== 'undefined')
							activeScene.assets.backgroundTexture.dispose();
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
//						console.log(activeProject);
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
								var backgroundTextureLoader = new THREE.TextureLoader();
								backgroundTextureLoader.load(
									backgroundFile.filepath,
									function (backgroundTexture)
									{
										console.log(backgroundTexture);
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
								);
							}
						}
					}
				}
			};

			scope.resizeCanvas = function()
			{
				var contW = window.innerWidth;
				var contH = window.innerHeight;
	
				camera.aspect = contW / contH;
				camera.updateProjectionMatrix();

		        if (scope.vrMode == true)
		        {
			        stereoEffect.setSize(contW, contH);
		        }
		        else
		        {
					renderer.setSize(contW, contH);
		        }
			};

			scope.toggleFullscreen = function()
			{
				// Check if we're already in fullscreen mode.
				if (element[0].fullscreenElement)
				{
					if (element[0].exitFullscreen) {
						element[0].exitFullscreen();
					} else if (element[0].msExitFullscreen) {
						element[0].msExitFullscreen();
					} else if (element[0].mozCancelFullScreen) {
						element[0].mozCancelFullScreen();
					} else if (element[0].webkitExitFullscreen) {
						element[0].webkitExitFullscreen();
					}
				}
				else
				{
					if (element[0].requestFullscreen) {
						element[0].requestFullscreen();
					} else if (element[0].msRequestFullScreen) {
						element[0].msRequestFullscreen();
					} else if (element[0].mozRequestFullScreen) {
						element[0].mozRequestFullScreen();
					} else if (element[0].webkitRequestFullscreen) {
						element[0].webkitRequestFullscreen();
					}
				}
				scope.resizeCanvas();
			};

			scope.render = function()
			{
				renderer.clear();
	
				// TODO: Add billboards to scene for hotspot labels that always face the camera.
				// See http://stackoverflow.com/questions/16001208/how-can-i-make-my-text-labels-face-the-camera-at-all-times-perhaps-using-sprite
	
				// Render the view.
				if (scope.vrMode == true)
				{
					if (typeof stereoEffect !== 'undefined')
					{
						stereoEffect.render(scene, camera);
						stereoEffect.clearDepth();
					}
				}
				else
				{
					renderer.render(scene, camera);
					renderer.clearDepth();
				}
			}

		    scope.init();
		    scope.animate();
		}
	}
});

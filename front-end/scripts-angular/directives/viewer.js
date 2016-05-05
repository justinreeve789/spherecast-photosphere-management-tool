'use strict';

angular.module('spherecastApp')
	.directive('spherecastViewer', function()
{
	return {
		restrict: '',
		scope: false,
		link: function(scope, element, attrs)
		{
		    var scene, camera, renderer, domElement
		    var activeProject, activeScene;
			var controls, orbitControls, deviceOrientationControls;
			var clock;

		    scope.init = function()
		    {
		        scene = new THREE.Scene();
				clock = new THREE.Clock();		// TODO: Use the clock to count hotspot durations.

		        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 10000 );
		        camera.position.set(0, 0, 0);

				// Controls
				scope.setControls();

		        renderer = new THREE.WebGLRenderer();
		        domElement = renderer.domElement;
		        renderer.setSize( window.innerWidth, window.innerHeight );
		        element[0].appendChild( domElement );

		        activeProject = scope.activeProject;
		        scope.loadNewScene(activeProject.startScene);
		    };

		    scope.animate = function()
		    {
		        requestAnimationFrame( scope.animate );

				if (orbitControls.enabled == true)
				{
					orbitControls.update(clock.getDelta());
				}
				else
				{
					deviceOrientationControls.update(clock.getDelta());
				}

		        renderer.render( scene, camera );
		    };

			scope.setControls = function()
			{
				window.addEventListener('deviceorientation', scope.setOrientationControls, true);

				orbitControls = new THREE.OrbitControls(camera, domElement);
				orbitControls.target.set(
					camera.position.x + 0.1,
					camera.position.y,
					camera.position.z
				);
				orbitControls.update();
			};

			scope.setOrientationControls = function(e)
			{
				if (!e.alpha) 
					return;

				if (typeof deviceOrientationControls === 'undefined' || !deviceOrientationControls)
				{
					deviceOrientationControls = new THREE.DeviceOrientationControls(camera);
					deviceOrientationControls.connect(clock.getDelta());
				}
			}

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

							console.log('test');
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

		    scope.init();
		    scope.animate();
		}
	}
});

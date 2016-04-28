'use strict';

angular.module('spherecastApp')
  .directive('ngWebgl', function() {
    return {
      restrict: 'A',
      scope: false,
      link: function(scope, element, attrs) {

		var orientationAlpha = 0, orientationBeta = 0, orientationGamma = 0, orientationAbs = 0;
		var orientationX = 0, orientationY = 0, orientationZ = 0, orientationAbs = 0;
		var orientationCompass = '';

		var currentAnimationFrameId;
		var processing_executeActions = false;
		var processing_scanHotspots = false;
		var processing_drawRaycasterOrientation = false;

        var camera, cameraOrtho,
        	scene, overlayScene, hotspotOverlayScene, labelOverlayScene, textOverlayScene, imageOverlayScene, videoOverlayScene,
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
		var sceneViewerCanvas;
		var cameraOrientationCanvas;
		var raycasterOrientationCanvas;
		var activeScene = {};
		var activeSceneJump = null;			// A flag which indicates we're ready to jump to another scene. 
		var activeHotspot = null;			// Only one hotspot can be active (i.e. in the process of being triggered) at a time.
		var lastHotspot = null;
		var activeSceneAssets = {};			// TODO: Get rid of this, because it doesn't seem like we're using it anymore. It was "Anything that has been loaded on to the scene via actions."
//		var activeActionSequences = [];		// TODO: Get rid of this, because it doesn't seem like we're using it anymore.
		var activeEvents = [];
//		var cancelActions = [];				// An array of actions that need to be cancelled (i.e. set to complete).
		var audioPlayer;
		var videoPlayer;
		var videoCanvasContext;
		var videoTexture;
		var textCanvases = [];
		var imageCanvases = [];
		var videoCanvases = [];
		var textSprites = [];
		var imageSprites = [];
		var videoSprites = [];
		var labelSprites = [];
		var variables = [];					// An array of user-defined global variables.
		var variablesIndexes = [];			// An array of the index of each variable in the "variables" variable (lulz).
		var spritemaps = [];
		var spritemapIndexes = [];
		var blockHotspots = false;

		var preloaderManifest;
		var currentPreloadingScene;
		var preloadedScenes = [];
		var continueScene = true;			// A flag which indicates whether we can keep going through the scene, or need to wait to load other media.

		var activatedAudioPlayer = false;	// Indicates whether or not we've done the initial trigger for audio (since mobile requires it before playback).
		var activatedVideoPlayer = false;	// Indicates whether or not we've done the initial trigger for video (since mobile requires it before playback).

		// TODO: Use a JSON of all hotspots retrieved from the database.
		var hotspots = [];
		var hotspotCountdowns = [];
		var clock = new THREE.Clock();		// TODO: Use the clock to count hotspot durations.

		var rayTime = 0;
		var currentPreloadAssets = 0;
		var preloadQueue = [];
		var currentPreloadImage = null;
		var newSceneAfterPreload = null;
		var showLoadingScreen = false;

		var preloadAssetsQueue = new createjs.LoadQueue(true);
		preloadAssetsQueue.installPlugin(createjs.Image);
		preloadAssetsQueue.installPlugin(createjs.Sound);
		preloadAssetsQueue.installPlugin(createjs.Video);

		// The following variables track the coordinates set in the touchstart and touchend events.
		var touchScreenStartX;
		var touchScreenStartY;
		var touchScreenEndX;
		var touchScreenEndY;
		var touchScreenDrag;

//		scope.$watch('activeProject', function(activeProject) {
//		});

		scope.$watch('showLoadingScreen', function(exp, listener)
		{
//			alert(scope.showLoadingScreen);
			showLoadingScreen = scope.showLoadingScreen;
		});

		// Priority is optional, but can be used to only load assets of a single priority level.
		scope.setPreloadAssetsForScene = function(newScene, priority)
		{
			scope.showLoadingScreen = true;
			showLoadingScreen = true;
//			scope.$apply();
			scope.jumpToScene(newScene);
			return;

			var sceneId = newScene.id;

			var assets = scope.activeProject.assets;
			if (typeof assets.scenes[sceneId] !== 'undefined')
			{
				// Priority 1-5.
				for (var l = 1; l <= 5; l++)
				{
					var priorityAssets = assets.priorities[l];
					for (var p = 0; p < priorityAssets.length; p++)
					{
						// Check if the asset indicated in the priorities is in the current scene.
						if (assets.scenes[sceneId].indexOf(priorityAssets[p]) > -1)
						{
							// Retrieve the media object.
							var media = assets.media[priorityAssets[p]];
							var mediaFile = scope.getMediaFile(media);
							if (mediaFile !== null)
							{
								if (media.type == 'backgroundimage' || media.type == 'image')
									preloadAssetsQueue.loadFile({ src: mediaFile.filepath, type: createjs.AbstractLoader.IMAGE });
								else if (media.type == 'audio')
									preloadAssetsQueue.loadFile({ src: mediaFile.filepath, type: createjs.AbstractLoader.SOUND });
								else if (media.type == 'backgroundvideo' || media.type == 'video')
									preloadAssetsQueue.loadFile({ src: mediaFile.filepath, type: createjs.AbstractLoader.VIDEO });
							}
						}
					}
				}
				newSceneAfterPreload = newScene;
				preloadAssetsQueue.on('complete', scope.completePreload, this);
				preloadAssetsQueue.load();
			}
//			scope.jumpToScene(newSceneAfterPreload);
		}

		scope.completePreload = function(event)
		{
			scope.showLoadingScreen = false;
			showLoadingScreen = false;
			scope.jumpToScene(newSceneAfterPreload);
		}

		scope.setPreloadImagesForScene = function(sceneId)
		{
			preloadQueue.length = 0;
			if (typeof scope.activeProject.jumpTargets !== 'undefined')
			{
				if (scope.activeProject.jumpTargets != null)
				{
					if (typeof scope.activeProject.jumpTargets[sceneId] !== 'undefined')
					{
						var targets = scope.activeProject.jumpTargets[sceneId];
						for (var j = 0; j < targets.length; j++)
						{
							// TODO: Use the sceneId to index the scene objects like we're doing with the jump targets.
							for (var s = 0; s < scope.activeProject.scenes.length; s++)
							{
								var scene = scope.activeProject.scenes[s];
								if (scene.id == targets[j])
								{
									if (typeof scene.backgroundMedia !== 'undefined' && scene.backgroundMedia != null)
									{
										var media = scope.getMediaFile(scene.backgroundMedia);
										if (preloadQueue.indexOf(media.filepath) === -1)
											preloadQueue.push(media.filepath);
									}
									break;
								}
							}
						}
					}
				}
			}
			scope.preloadImages();
		}

		scope.preloadImages = function()
		{
			if (preloadQueue.length > 0)
			{
				var image = new Image();
				image.onload = function()
				{
					scope.preloadImages();
				}
				image.src = preloadQueue.pop();
			}
		}

		// As the user moves to different scenes, the preload queue changes as necessary, to make sure
		// the most relevant content is being loaded. We should try to stay one step ahead of the user's
		// actions, so the next scenes' assets are being loaded while the user is in a scene.
		scope.initializePreloadedAssets = function(sceneId, simImageAssets, simAudioAssets, simVideoAssets, simTotalAssets)
		{
			var preload = new createjs.LoadQueue();
			preload.on('fileload', handleFileLoad);
			preload.on('progress', handleOverallProgress);
			preload.on('fileprogress', handleFileProgress);
			preload.on('error', handleFileError);
			preload.setMaxConnections(5);

			function handleFileLoad()
			{}

			function handleOverallProgress()
			{}

			function handleFileProgress()
			{}

			function handleFileError()
			{}
		}

		scope.checkPreloadedAssets = function(sceneId, simImageAssets, simAudioAssets, simVideoAssets, simTotalAssets)
		{
			if (preloadQueue.length > 0)
			{
				var nextAsset = preloadQueue.shift();
				if (typeof sceneId !== 'undefined')
				{
					// TODO: Download different numbers of assets based on user's bandwidth.
					if (typeof simImageAssets === 'undefined' || simImageAssets == null)
						simImageAssets = 2;
					if (typeof simAudioAssets === 'undefined' || simAudioAssets == null)
						simAudioAssets = 1;
					if (typeof simVideoAssets === 'undefined' || simVideoAssets == null)
						simVideoAssets = 1;
					if (typeof simTotalAssets === 'undefined' || simTotalAssets == null)
						simTotalAssets = 3;

					for (var i = 0; i < activeProject.assets.items.length; i++)
					{
						if (activeProject.assets.items[i].sceneId == sceneId)
						{
//							for (var m = 0; m < )
						}
					}
				}
			}
		}

		scope.preloadAsset = function(asset)
		{
		}

		// If we're on a mobile device and require a tap to continue, we must have to present a
		// "tap to continue" screen first, so we can initialize the audio and video players, and
		// go to fullscreen mode.

		// An intro scene is a page that indicates the user must click to continue. Custom intro scenes
		// can be added, and if one is specified it will always load. This is NOT a photosphere, but
		// a standard image. By default it uses a preset "Tap to Continue" message on a black background,
		// and only loads when the user is on a mobile getting injected at the beginning of the project.

		// TODO: Allow custom intro scenes.
		scope.checkForIntroScene = function()
		{
			function activateMediaAndGoToFullscreen(event)
			{
				// Remove the "Please tap screen to continue" image.
				var continueMessage = document.getElementById('viewer-continue');
				continueMessage.parentNode.removeChild(continueMessage);

				// TODO: Don't let this interfere with any events at the beginning which play audio. When
				// actually playing a complete VR spherecast or previewing a scene in VR mode, a landing
				// page should always come up first and prompt a keypress to go to fullscreen (and activate
				// audio and video playback).
				if (activatedAudioPlayer == false)
				{
					if (audioPlayer.paused)
					{
						// TODO: Assign the first audio file to this player.
	
						// Start and immediately stop the player.
						audioPlayer.play();
						audioPlayer.pause();
					}
					activatedAudioPlayer = true;
				}

				if (activatedVideoPlayer == false)
				{
					if (videoPlayer.paused)
					{
						// TODO: Assign the first video file to this player.
	
						// Start and immediately stop the player.
						videoPlayer.play();
						videoPlayer.pause();
					}
					activatedVideoPlayer = true;
				}

				if (!scope.isFullScreen())
				{
					scope.fullscreen();
				}

				window.removeEventListener('click', activateMediaAndGoToFullscreen);

				if (!isNaN(scope.activeScene))
					scope.loadPage(scope.activeScene.id)
				else
					scope.loadPage(scope.activeProject.startScene);
			}

			if (scope.requireTapToContinue == true)
			{
				// Inject the "Please tap screen to continue" image.
				var continueMessage = document.createElement('div');
				continueMessage.id = 'viewer-continue';
				if (typeof scope.activeProject.introMedia !== 'undefined')
				{
					if (scope.activeProject.introMedia)
					{
						var introFile = scope.getMediaFile(scope.activeProject.introMedia);
						continueMessage.style.backgroundImage = 'url("' + introFile.filepath + '")';
					}
				}
//				continueMessage.innerHTML = '<img src="/assets/images/tap-to-continue.png" alt="Please tap screen to continue" />';
				element[0].appendChild(continueMessage);

				// The "click" event, in addition to activating fullscreen mode on mobile, should also activate
				// playback of audio and video. We're putting this here instead of the "deviceorientation" event
				// since we may not always want VR mode to be activated on some phones or tablets.
				element[0].addEventListener('click', activateMediaAndGoToFullscreen);
			}
			else
			{
				if (!isNaN(scope.activeScene))
					scope.loadPage(scope.activeScene.id)
				else
					scope.loadPage(scope.activeProject.startScene);
			}
		}

		// Initialize the viewer.
		scope.init = function()
		{
//			scope.projectLoaded = false;
//			scope.projectLoaded = true;
			clock.start();
			rayTime = clock.getElapsedTime();

			// Primary scene
			scene = new THREE.Scene();

			// Scene rendered with an orthographic camera
			overlayScene = new THREE.Scene();

			// Overlay scene for labels. Labels are always for items that must always be on top, such as
			// text labels. This does not count image labels, which are actually considered hotspot images,
			// and are presented on hotspotOverlayScene, which appears one level below labelOverlayScene.
//			labelOverlayScene = new THREE.Scene();

//			videoOverlayScene = new THREE.Scene();
//			imageOverlayScene = new THREE.Scene();

			// Renderer
//			renderer = new THREE.WebGLRenderer({antialias: true});
			renderer = new THREE.WebGLRenderer();
//			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setClearColor(0x000000);
			renderer.setSize(contW, contH);
			renderer.autoClear = false;
			domElement = renderer.domElement;

			// Main camera (perspective)
			contW = scope.windowWidth;
			contH = scope.windowHeight;
			camera = new THREE.PerspectiveCamera(90, (contW / 2) / contH, 0.001, 1000);
			camera.position.set(0, 0, 0);
			scene.add(camera);

			// Overlay HUD camera (orthographic)
//			cameraOrtho = new THREE.OrthographicCamera(-windowHalfX, windowHalfX, windowHalfY, -windowHalfY, 1, 10 );
//			cameraOrtho.position.z = 10;

			// Element is provided by the angular directive
			sceneViewerCanvas = element[0].appendChild(domElement);
			sceneViewerCanvas.id = 'sceneViewerCanvas';

			// Controls
			orbitControls = new THREE.OrbitControls(camera, domElement);
//			controls.rotateUp(Math.PI / 4);
//			controls.rotateLeft(-270 * Math.PI / 180);
			orbitControls.target.set(
				camera.position.x + 0.1,
				camera.position.y,
				camera.position.z
			);
//			controls.connect();
			orbitControls.update();
/*
			deviceOrientationControls = new THREE.DeviceOrientationControls(camera);
			deviceOrientationControls.connect(clock.getDelta());
			deviceOrientationControls.update(clock.getDelta());
			deviceOrientationControls.enabled = false;
*/
//			window.addEventListener('resizeCanvas', scope.onWindowResize, false);

			// Continually update the camera orientation with a self-calling function.
//			scope.getCompassDirection();
			scope.drawCameraOrientation();
			scope.drawRaycasterOrientation();	// We're not bothering to create this after loadPage(), since we don't want hotspots to be activated as soon as the scene loads up anyway.

			// On mobile devices, we'll want to have a loading screen that requires the user to press the
			// screen to get to fullscreen first. Then a short animation can instruct them to insert their
			// phone into their VR headset, and everything can autoplay after that.

			// We might have to restructure the <audio> and <video> tags to include all the sources first,
			// if media items aren't playing as they should.
			scope.createAudioPlayer();
			scope.createVideoPlayer();

			// Don't continue if the scope doesn't have an activeProject yet.
			if (typeof scope.activeProject === 'undefined')
				return;

			// Crosshairs HUD
			if (scope.activeProject.showCrosshairs == true)
				scope.crosshairs();

			// Confirm the microphone now, if applicable, so the user isn't prompted to do it later when
			// they're in the middle of a scene.
//			scope.confirmMicrophone();

			scope.setInitialVariables();

//			scope.scanHotspots();
//			scope.executeActions();
			setTimeout(function()
			{
				scope.scanHotspots();
			}, 1);

			setTimeout(function()
			{
				scope.executeActions();
			}, 1);
/*
			setInterval(function()
			{
				if (processing_scanHotspots != true)
				{
					processing_scanHotspots = true;
					scope.scanHotspots();
				}
			}, 25);

			setInterval(function()
			{
				if (processing_executeActions != true)
				{
					processing_executeActions = true;
					scope.executeActions();
				}
			}, 25);
*/
			scope.toggleMode();

			if (typeof scope.activeProject.prefetchAssets !== 'undefined')
			{
				preloaderManifest = scope.activeProject.prefetchAssets.sceneManifest;
				currentPreloadingScene = scope.activeProject.startScene;
				scope.prefetch(currentPreloadingScene);
			}

			// TODO: Activate fullscreen on a screen click for mobile devices, and only on a single screen at
			// the beginning of the spherecast. Because of how Angular works (/#/), we may actually not even
			// need to do this over again if they jump between spherecasts.
/*
			domElement.addEventListener('click', function()
			{
				if (!scope.isFullScreen()) {
				    scope.fullscreen();
				}
			});
*/
			window.addEventListener('resize', scope.onWindowResize, false);

			// Add the touch event on the domElement so clicking the viewer icons doesn't trigger it.
			domElement.addEventListener('touchstart', scope.touchScreenStartEvent, false);
//			domElement.addEventListener('touchmove', scope.touchScreenMoveEvent, false);
			domElement.addEventListener('touchend', scope.touchScreenEndEvent, false);

//			console.log(currentAnimationFrameId);
/*
			renderer.context.canvas.addEventListener("webglcontextlost", function(event) {
			    event.preventDefault();
			    // animationID would have been set by your call to requestAnimationFrame
			    cancelAnimationFrame(currentAnimationFrameId);
			    alert('Oops! Your device ran into a problem viewing this tour. Please try reloading the page.');
			}, false);
			
			renderer.context.canvas.addEventListener("webglcontextrestored", function(event) {
			   // Do something 
			}, false);
			renderer.context.canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(renderer.context.canvas);
*/
			scope.checkForIntroScene();
		};



		// See https://github.com/mrdoob/three.js/issues/730
		scope.getCompassDirection = function()
		{
			// Check that we're using a device with a compass.
//			console.log(controls.alpha);
			if (typeof deviceOrientationControls !== 'undefined')
			{
				if (deviceOrientationControls.alpha != null)
				{
					// The deviceOrientation north is not exactly the north we want, since users will
					// be wearing their phone vertically. The back of the phone is what points to the
					// direction we want, instead of top of the phone, so we need to do a few extra
					// calculations here. What we're going to do is combine the alpha and beta to get
					// a different "direction" number that indicates north, and can be saved to a scene's
					// parameters so it knows which way to orient itself.
				}
			}

			setTimeout(function()
			{
				currentAnimationFrameId = window.requestAnimationFrame(scope.getCompassDirection);
			}, 1);
		}



		// Determine if there's at least one voice event in a scene. If so, we need to confirm microphone access.
		scope.confirmMicrophone = function()
		{
			for (var s = 0; s < scope.activeProject.scenes.length; s++)
			{
				var checkScene = scope.activeProject.scenes[s];
				if (typeof checkScene.voiceEvents !== 'undefined')
				{
/*
					if (typeof scope.activeProject.voiceLanguage !== 'undefined')
					{
						voix = new Voix(scope.activeProject.voiceLanguage);
						voix.start();
						voix.stop();
					}
*/
					if (checkScene.voiceEvents.length > 0)
					{
						if (annyang)
						{
							annyang.debug();
							if (typeof scope.activeProject.voiceLanguage !== 'undefined')
							{
								annyang.setLanguage(scope.activeProject.voiceLanguage);
							}
//							annyang.start({autoRestart: true, continuous: true});
							annyang.start();
//							annyang.abort();
						}
						return;
					}
				}

			}
		}



		// Assign the variables to their defaults.
		// TODO: If we're loading a saved session, load the variable values from the database.
		scope.setInitialVariables = function()
		{
			if (typeof scope.activeProject.globalVariables !== 'undefined')
			{
				for (var v = 0; v < scope.activeProject.globalVariables.length; v++)
				{
					var variable = scope.activeProject.globalVariables[v];
					if (typeof variable.defaultValue !== 'undefined')
					{
						variable.value = variable.defaultValue;
					}
					else
					{
						variable.value = '';
					}
					variables.push(variable);
					variablesIndexes[v] = variable.name;
				}
			}
		}



		scope.loadPage = function(sceneId)
		{
			var newScene = null;

			// Make sure the scene is in the project.
			if (typeof sceneId != 'undefined' && !isNaN(sceneId))
			{
				if (scope.activeProject)
				{
					if (scope.activeProject.scenes && scope.activeProject.scenes.length >= 1)
					{
						for (var s = 0; s < scope.activeProject.scenes.length; s++)
						{
							if (scope.activeProject.scenes[s].id == sceneId)
							{
								newScene = scope.activeProject.scenes[s];
								break;
							}
						}
					}
				}
			}

			if (newScene)
			{
				// TODO: Use a promise chain for events (this may not be ideal), so we know we're okay
				// to actually start clearing out scene activity and load the new scene. Move the load
				// scene code back here.

				// TODO: Check the queue				
				// Flag the active scene as being ready for a jump as soon as all the events are removed
				// from the queue in executeActions().
				activeSceneJump = newScene;

				// Go through activeEvents and mark each one as complete to get rid of extra canvases.
				// TODO: Is this the best approach, or is it going to break stuff?
				// TODO: Directly delete all extra canvases instead?
				for (var e = 0; e < activeEvents.length; e++)
				{
					if (activeEvents[e].actions === Array)
					{
						for (var a = 0; a < activeEvents[e].actions.length; a++)
						{
							if (typeof activeEvents[e].actions !== 'undefined')
							{
								activeEvents[e].actions[a].complete = true;
							}
						}
					}
				}
			}
		}



		scope.jumpToScene = function(newScene)
		{
			scope.showLoadingScreen = false;
			showLoadingScreen = false;

			// Make sure the new scene's assets are loaded. While the user is in the previous scene, they should have
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

			// Stop any audio, unless the audioPlayer has the "persist" flag set.
			if (typeof audioPlayer !== 'undefined')
			{
//				alert('Audio Player Persist: ' + audioPlayer.dataset.persist);
				if (typeof audioPlayer.dataset.persist === undefined)
				{
					audioPlayer.pause();
				}
				else if (audioPlayer.dataset.persist == 1)
				{
					// The audio player was persisted.
				}
				else
				{
					audioPlayer.pause();
				}
//				audioPlayer.currentTime = 0;
			}

			// Clear out any scene activity.
			// See http://stackoverflow.com/questions/1232040/empty-an-array-in-javascript for various approaches.
			blockHotspots = false;
			activeHotspot = null;
			lastHotspot = null;
			hotspots = [];
//			activeActionSequences = [];

			// All events should have completed by now, so we can reset the activeEvents array.
			activeEvents = [];

			// TODO: Clear out label, text, image, and video sprites, as well as spritemap animations.
			if (typeof activeScene.labelSprites !== 'undefined')
			{
				for (var s = 0; s < activeScene.labelSprites.length; s++)
				{
					scene.remove(activeScene.labelSprites[s]);
//					activeScene.labelSprites[s].dispose();
				}
			}

			if (typeof activeScene.textSprites !== 'undefined')
			{
				for (var s = 0; s < activeScene.textSprites.length; s++)
				{
					scene.remove(activeScene.textSprites[s]);
//					activeScene.textSprites[s].dispose();
				}
			}

			if (typeof activeScene.imageSprites !== 'undefined')
			{
				for (var s = 0; s < activeScene.imageSprites.length; s++)
				{
					scene.remove(activeScene.imageSprites[s]);
//					console.log(activeScene.imageSprites[s]);
//					activeScene.imageSprites[s].dispose();
				}
			}

			if (typeof activeScene.videoSprites !== 'undefined')
			{
				for (var s = 0; s < activeScene.videoSprites.length; s++)
				{
					scene.remove(activeScene.videoSprites[s]);
//					activeScene.videoSprites[s].dispose();
				}
			}

			if (typeof activeScene.spritemaps !== 'undefined')
			{
				for (var s = 0; s < activeScene.spritemaps.length; s++)
				{
//					scene.remove(activeScene.spritemaps[s]);
					activeScene.spritemaps[s].remove();
				}
			}

			// Clear out the overlay scene.
			// TODO: Is there a "better" way of clearing the overlay scene?
			if (overlayScene)
			{
				overlayScene = new THREE.Scene();
			}

			// Assign the active scene.
			scope.activeScene = newScene;
			activeScene = newScene;

			// Create arrays of the sprites that will end up being used, so we know what to delete when we're jumping
			// to a new scene.
			// TODO: Do we want to just use native three.js and removeChild() functions and get rid of everything with
			// certain classes from the scene?
			activeScene.labelSprites = [];
			activeScene.textSprites = [];
			activeScene.imageSprites = [];
			activeScene.videoSprites = [];
			activeScene.spritemaps = [];

			// TODO: Make sure all assets are prefetched before loading the scene.

			// TODO: We can have a starting orientation specified in the scene. XYZ coordinates can be
			// used for OrbitControls, but DeviceOrientationControls will be a little trickier, since
			// the headtracked position will override any YZ coordinates. So, we're going to just rotate
			// the sphere on its axis to achieve the desired result, and adjust the YZ of the camera
			// afterward if we're not in VR mode.
			if (orbitControls.enabled == true)
			{
				if (typeof activeScene.northX !== 'undefined')
				{
					var currentX = orientationX;
					var currentY = orientationY;
					var currentZ = orientationZ;
//					orientationX = orientationX * (180 / Math.PI) + 180;
//					orientationY = orientationY * (180 / Math.PI) + 180;
//					orientationZ = orientationZ * (180 / Math.PI) + 180;
//					var diff = (orientationX * (180 / Math.PI)) - (activeScene.northX * (180 / Math.PI));
//					currentX += 1;
					var diff = currentX - activeScene.northX;
/*
					console.log(camera);
					console.log(activeScene.northX);
					console.log('Camera Rotation: ' + camera.rotation.x + ' ' + camera.rotation.y + ' ' + camera.rotation.z);
					console.log('Diff: ' + diff);
					console.log('Current: ' + orientationX + ' ' + orientationY + ' ' + orientationZ);
					console.log('Orbit: ' + activeScene.northX + ' ' + activeScene.northY + ' ' + activeScene.northZ);
					console.log(orbitControls);
*/
				}

//				console.log(activeScene.northRotationOffset);
				if (typeof activeScene.northRotationOffset !== 'undefined')
				{
					orbitControls.rotateLeft(activeScene.northRotationOffset * -1);
				}
			}
			else
			{
//				console.log('DeviceOrientation: ' + activeScene.northX + ' ' + activeScene.northY + ' ' + activeScene.northZ);

				// Rotate the sphere.
			}

			// Load the scene background.
			if (activeScene.backgroundFile !== null || activeScene.backgroundMedia !== null)
			{
				if (typeof activeScene.backgroundMedia == 'undefined' || activeScene.backgroundMedia == null)
				{
					// No background media is present, but we still need a sphere for raycasting. Load a blank photosphere.
					var backgroundGeometry = new THREE.SphereGeometry(100, 32, 32);
					var backgroundMaterial = new THREE.MeshBasicMaterial({
							color: 0X000000,
							side: THREE.DoubleSide,
					});
					activeScene.background = new THREE.Mesh(
						backgroundGeometry, backgroundMaterial
					);
					activeScene.background.material.side = THREE.DoubleSide;
					activeScene.background.scale.x = -1;
					scene.add(activeScene.background);
				}
				else
				{
					if (activeScene.backgroundMedia.type == 'backgroundimage')
					{
						// TODO: Look at the width and height of the background image to determine how to map the texture.
						// If it's a 2:1 aspect ratio, assume it's an equirectangular photosphere. If wider than
						// 2:1, assume it's a panorama, and add enough blank space on the top and bottom to compensate.

						// It's not clear if three.js is capable of mapping only on a certain part of the sphere. We
						// may just turn the background into a "child" of the main background image uploaded, and handle
						// this in the creation utility itself so it has the proper amount of blank space around it for
						// a 2:1 aspect ratio.

						var backgroundFile = scope.getMediaFile(activeScene.backgroundMedia);

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
							activeScene.background = new THREE.Mesh(
								backgroundGeometry, backgroundMaterial
							);
							activeScene.background.material.side = THREE.DoubleSide;
							activeScene.background.scale.x = -1;
							scene.add(activeScene.background);
							activeScene.backgroundTexture = backgroundTexture;
						}
					}
				}

				if (typeof activeScene.backgroundFile !== 'undefined')
				{
					if (activeScene.backgroundFile.fileType == 'image')
					{
						// TODO: Look at the width and height of the background image to determine how to map the texture.
						// If it's a 2:1 aspect ratio, assume it's an equirectangular photosphere. If wider than
						// 2:1, assume it's a panorama, and add enough blank space on the top and bottom to compensate.

						// It's not clear if three.js is capable of mapping only on a certain part of the sphere. We
						// may just turn the background into a "child" of the main background image uploaded, and handle
						// this in the creation utility itself so it has the proper amount of blank space around it for
						// a 2:1 aspect ratio.
						var backgroundTexture = THREE.ImageUtils.loadTexture(activeScene.backgroundFile.filePath);
						backgroundTexture.minFilter = THREE.LinearFilter;
//						backgroundTexture.repeat.x = 1;
//						backgroundTexture.repeat.y = 1;
//						backgroundTexture.wrapS = backgroundTexture.wrapT = THREE.MirroredRepeatWrapping;
//						backgroundTexture.offset.y = -0.15;

						// TODO: Do we need to make sure the sphere is only created once when the viewer loads?
						var backgroundGeometry = new THREE.SphereGeometry(100, 32, 32);
						var backgroundMaterial = new THREE.MeshBasicMaterial({
								map: backgroundTexture,
//								side: THREE.DoubleSide,
						});
						activeScene.background = new THREE.Mesh(
							backgroundGeometry, backgroundMaterial
						);
//						activeScene.background.material.side = THREE.DoubleSide;
						activeScene.background.scale.x = -1;
						scene.add(activeScene.background);
					}
					else if (activeScene.backgroundFile.fileType == 'video')
					{
						// TODO: Consider using https://github.com/jeromeetienne/threex.videotexture
						videoPlayer.src = activeScene.backgroundFile.filePath;
						if (activeScene.backgroundFile.fileMimeType != 'undefined')
						{
							videoPlayer.type = activeScene.backgroundFile.fileMimeType;
						}
						videoPlayer.load();

						var videoCanvas = document.createElement('canvas');
						videoCanvas.width = 800;
						videoCanvas.height = 600;

						videoCanvasContext = videoCanvas.getContext('2d');
						videoCanvasContext.fillstyle = '#000000';
						videoCanvasContext.fillRect(0, 0, videoPlayer.width, videoPlayer.height);

//						videoTexture = new THREE.Texture(videoCanvas);
						videoTexture = new THREE.Texture(videoPlayer);
						videoTexture.minFilter = THREE.LinearFilter;
						videoTexture.magFilter = THREE.LinearFilter;

						var videoMaterial = new THREE.MeshBasicMaterial({
							map: videoTexture,
							overdraw: false,
						});
//						videoTexture.offset.y = -0.5;

						// TODO: Do we need to make sure the sphere is only created once when the viewer loads?
						var sphereGeo = new THREE.SphereGeometry(100, 32, 32);
//						sphereGeo.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
						activeScene.background = new THREE.Mesh(
							sphereGeo,
							new THREE.MeshBasicMaterial({
								map: videoTexture,
								overdraw: true,
							})
						);

						activeScene.background.scale.x = -1;
						activeScene.background.scale.y = 1;

//						var movieGeometry = new THREE.PlaneGeometry(240, 100, 4, 4);
//						var movieScreen = new THREE.Mesh(movieGeometry, videoMaterial);
//						movieScreen.position.set(0, 50, 0);
	
						scene.add(activeScene.background);
//						camera.position.set(0, 150, 300);
//						camera.lookAt(movieScreen.position);
						videoPlayer.play();
					}
				}

				if (typeof activeScene.background !== 'undefined')
				{
					activeScene.background.name = 'sceneBackground';
				}
			}
			else
			{
				// If there's no background, show a blank screen.
			}

			// Add the next images to the preload queue.
			scope.setPreloadImagesForScene(activeScene.id);

			// Set the initial controls bearing if one is specified.
			if (typeof activeScene.initialCameraX !== 'undefined' && typeof activeScene.initialCameraY !== 'undefined' && typeof activeScene.initialCameraZ !== 'undefined')
			{
				var initialOrientation = new THREE.Vector3(activeScene.initialCameraX, activeScene.initialCameraY, activeScene.initialCameraZ);
//				camera.up.set(0, 1, 0);
//				camera.lookAt(initialOrientation);
/*
				var tween = new TWEEN.Tween(camera.position).to({
				                x: 100,
				                y: 100,
				                z: 100,
				            }, 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
				                camera.lookAt(camera.target);
				            }).onComplete(function () {
				                camera.lookAt(camera.target);
				            }).start();
				console.log(camera);
*/
			}
/*
			console.log(controls);
			if (typeof controls.rotateLeft == 'function')
			{
				controls.rotateLeft(-90 * Math.PI / 180);
				controls.update();
			}
*/
			// Add start events to the queue.
			if (activeScene.startEvents)
			{
				for (var e = 0; e < activeScene.startEvents.length; e++)
				{
					// Check for conditions before adding it to the queue.
					var conditionFlag = true;
					if (typeof activeScene.startEvents[e].conditions !== 'undefined' && activeScene.startEvents[e].conditions.length > 0)
					{
						var cond = activeScene.startEvents[e].conditions;
						for (var c = 0; c < cond.length; c++)
						{ 
							if (cond[c].type == 'variable')
							{
								var varIndex = variablesIndexes.indexOf(cond[c].variableName);
								if (varIndex != -1)
								{
									// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
									// TODO: Take strings and numbers into account so we don't run into errors.
									if (cond[c].variableOperator == '=')
									{
										if (variables[varIndex].value != cond[c].variableOperand)
										{
											conditionFlag = false;
										}
									}
									else if (cond[c].variableOperator == '!=')
									{
										if (variables[varIndex].value == cond[c].variableOperand)
										{
											conditionFlag = false;
										}
									}
									else if (cond[c].variableOperator == '>')
									{
										if (variables[varIndex].value <= cond[c].variableOperand)
										{
											conditionFlag = false;
										}
									}
									else if (cond[c].variableOperator == '<')
									{
										if (variables[varIndex].value >= cond[c].variableOperand)
										{
											conditionFlag = false;
										}
									}
								}
							}
						}
					}

					if (conditionFlag == true)
					{
						// Block hotspots if necessary.
						if (activeScene.startEvents[e].blockHotspots == true)
						{
							blockHotspots = true;
						}

						activeEvents.push(activeScene.startEvents[e]);
					}
				}
			}

			// Listen to voice events for this scene, but only run this if there are voice events, so we're not
			// wasting resources.
			if (typeof activeScene.voiceEvents !== 'undefined' && activeScene.voiceEvents.length > 0)
			{
				scope.listenVoiceEvents();
			}

			// Continually check if the user is hitting any hotspots. In standard mode, the user clicks on it.
			// In VR mode, this will be triggered if the camera is looking within its radius. If they are,
			// flag it as true and start counting the number of seconds that the user holds position within
			// the radius. If the camera moves out the hotspot, flag it as false and stop counting. If the
			// flag is true and the duration of the hotspot is reached, start activating the actions in the
			// event. All actions will occur in sequential order.
			hotspots = activeScene.hotspots;
			scope.drawHotspotLabels();
		}



		function getSceneInSequence(sceneId)
		{
			// If a null or invalid scene is passed, start out with the first scene in the project.
			if (typeof sceneId == 'undefined' || isNaN(sceneId))
			{
				// Check the startScene variable, if it exists. If not, find the first scene in the array.
				var firstScene;
				if (scope.activeProject.startScene && !isNaN(scope.activeProject.startScene))
				{
					scope.activeProject.scenes.forEach(function(sc)
					{
						if (sc.id == scope.activeProject.startScene)
						{
							firstScene = sc;
						}
					});
				}

				if (firstScene)
				{
					scope.activeScene = firstScene;
					activeScene = firstScene;
					return scope.activeScene;
				}
				else if (scope.activeProject.scenes && scope.activeProject.scenes.length >= 1)
				{
					scope.activeScene = scope.activeProject.scenes[0];
					activeScene = scope.activeProject.scenes[0];
					return scope.activeScene;
				}
			}
			else
			{
				// Find the scene id in the project. If it doesn't exist, call this function again without any parameters
				// to get the first one in the project.
//				scope.activeProject = activeProject;
				if (scope.activeProject.scenes && scope.activeProject.scenes.length >= 1)
				{
					scope.activeProject.scenes.forEach(function(sc)
					{
						if (sc.id == sceneId)
						{
							scope.activeScene = sc;
							activeScene = sc;
							return sc;
						}
					});
					return getSceneInSequence();
				}
			}
		}



		// TODO: Determine the best file to deliver depending on device, bandwidth, connection speed, current cache,
		// and user preferences.
		scope.getMediaFile = function(media)
		{
			if (typeof media.files !== 'undefined')
			{
				var mediaFile;
				for (var f = 0; f < media.files.length; f++)
				{
					if (media.files[f].id == media.fileIdHigh)
					{
						mediaFile = media.files[f];
						break;
					}
				}
				return mediaFile;
			}
			return null;
		}




        // -----------------------------------
        // Event listeners
        // -----------------------------------
		scope.onWindowResize = function () {
			scope.resizeCanvas();
		};

		// Any label position should be calculated in terms of an offset from the sphere.
		// See http://stackoverflow.com/questions/15079592/how-to-add-label-to-sphere-in-three-js
		// TODO: Create rounded rectangles.
		// See http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
		scope.drawHotspotLabels = function()
		{
			// Add the hotspot labels.
			// See https://gist.github.com/ekeneijeoma/1186920
			for (var h = 0; h < hotspots.length; h++)
			{
				if (hotspots[h].labels !== undefined)
				{
					for (var l = 0; l < hotspots[h].labels.length; l++)
					{
						var label = hotspots[h].labels[l];
						if (label.type !== undefined)
						{
							if (label.type == 'text')
							{
								if (typeof label.fontSize === 'undefined')
									label.fontSize = 50;

								if (typeof label.fontColor === 'undefined')
									label.fontColor = 'white';

								if (typeof label.fontStyle === 'undefined')
									label.fontStyle = '';

//								var mesh = scope.createTransparentLabel(label.text, label.positionX, label.positionY, label.positionZ, label.fontSize, label.fontColor, label.fontStyle);
//								activeScene.labelSprites.push(mesh);
//								scene.add(mesh);
								scope.createTransparentLabel(label.text, label.positionX, label.positionY, label.positionZ, label.fontSize, label.fontColor, label.fontStyle, hotspots[h].conditions);
							}
							else if (label.type == 'image')
							{
								// If we don't have a file path, disregard this action altogether.
								if (label.media)
								{
									var imageMediaFile = scope.getMediaFile(label.media);
									if (!imageMediaFile)
									{
									}
									else
									{
										var imageCanvas = scope.createImageCanvas();
										if (imageCanvas)
										{
//											hotspots[h].labels[l].imageCanvas = imageCanvas;
											var imageTexture = THREE.ImageUtils.loadTexture(imageMediaFile.filepath);
											imageTexture.minFilter = THREE.LinearFilter;
											imageTexture.needsUpdate = true;

											var imageSpriteMaterial = new THREE.SpriteMaterial({
												map: imageTexture,
												transparent: true,
											});

											// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
											// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
											imageSpriteMaterial.depthWrite = false;
											imageSpriteMaterial.depthTest = false;

											if (typeof label.opacity !== 'undefined')
												imageSpriteMaterial.opacity = label.opacity;
											else
												imageSpriteMaterial.opacity = 0.85;

											var imageSprite = new THREE.Sprite(imageSpriteMaterial);

											var scaleX = 50;
											var scaleY = 50;
											if (typeof label.scaleX !== 'undefined')
											{
												scaleX *= label.scaleX;
											}
											if (typeof label.scaleY !== 'undefined')
											{
												scaleY *= label.scaleY;
											}

											imageSprite.scale.set(scaleX, scaleY, 1.0);
											imageSprite.position.set(label.positionX, label.positionY, label.positionZ, 1.0);
//											activeScene.imageSprites.push(imageSprite);

											// Add the hotsopt's conditions to the sprites, so we can later reference this in
											// case we need to hide/show the label.
											if (typeof hotspots[h].conditions !== 'undefined')
											{
												imageSprite.conditions = hotspots[h].conditions;
											}

											activeScene.labelSprites.push(imageSprite);
											scene.add(imageSprite);
											imageSpriteMaterial.dispose();
											imageTexture.dispose();
										}
									}
								}
							}
						}
					}
				}
			}
		}

		scope.createLabelCanvas = function()
		{
			var labelCanvas = document.createElement('canvas');
			labelCanvas.id = 'label_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			labelCanvas.className = 'labelCanvas';
			labelCanvas.width = element[0].clientWidth;
			labelCanvas.height = element[0].clientHeight;
			element[0].appendChild(labelCanvas);
			return labelCanvas;
		}

		scope.createTransparentLabel = function(text, x, y, z, size, color, style, opacity, conditions)
		{
			var labelCanvas = scope.createLabelCanvas();
			var textCanvas = scope.createTextCanvas();
			var labelSprite;
			if (labelCanvas && textCanvas)
			{
				// TODO: Allow custom transparent images to be used with labels.
				var img = new Image();
				img.onload = function()
				{
					var textCanvasContext = textCanvas.getContext('2d');
					wrapText(textCanvasContext, null, text, size, color, style, 2.0, null, 15);

					var width = textCanvas.width;
					var height = textCanvas.height;
					var cornerRadius = 36;

					var imageWidth = img.width;
					var imageHeight = img.height;
					var canvasPadding = 20;

					// Make sure the label can fit the image properly.
					if (width < imageWidth)
						width = imageWidth;
					if (height < imageHeight)
						height = imageHeight;

					// Round the height to the next multiple of four, so we can divide in half evenly later.
					height = 4 * Math.ceil(height / 4);

					labelCanvas.width = (canvasPadding * 2) + width + imageWidth + cornerRadius;
					labelCanvas.height = (canvasPadding * 2) + height + cornerRadius;
					var labelCanvasContext = labelCanvas.getContext('2d');

					// Make sure to allow room for the image, as well as padding.
					// See http://jsfiddle.net/robhawkes/gHCJt/light/ for rounded rectangles.
					labelCanvasContext.fillStyle = 'black';
					labelCanvasContext.lineJoin = 'round';
					labelCanvasContext.lineWidth = cornerRadius;
					labelCanvasContext.strokeRect(0 + (cornerRadius / 2), 0 + (cornerRadius / 2), labelCanvas.width - cornerRadius, labelCanvas.height - cornerRadius);
					labelCanvasContext.fillRect(0 + (cornerRadius / 2), 0 + (cornerRadius / 2), labelCanvas.width - cornerRadius, labelCanvas.height - cornerRadius);

					// Set rounded corners.
					labelCanvasContext.lineJoin = 'round';
					labelCanvasContext.lineWidth = cornerRadius;

					// Change origin and dimensions to match true size (a stroke makes the shape a bit larger)
					labelCanvasContext.strokeRect(0 + (cornerRadius / 2), 0 + (cornerRadius/2), labelCanvas.width - cornerRadius, labelCanvas.height - cornerRadius);
					labelCanvasContext.fillRect(0 + (cornerRadius / 2), 0 + (cornerRadius/2), labelCanvas.width - cornerRadius, labelCanvas.height - cornerRadius);

					// Clear out space on the center right for the image.
					labelCanvasContext.clearRect(width + (canvasPadding * 2) + (cornerRadius / 2), ((height / 2) - (imageHeight / 2)) + (cornerRadius / 2), imageWidth, imageHeight);

					// Add the text.
					labelCanvasContext.drawImage(textCanvas, canvasPadding, canvasPadding);

					// Add the transparent image.
					labelCanvasContext.drawImage(img, width + (canvasPadding * 2) + (cornerRadius / 2), ((height / 2) - (imageHeight / 2)) + (cornerRadius / 2));

					// Use the label canvas as a texture and sprite.
					var labelTexture = new THREE.Texture(labelCanvas);
					labelTexture.minFilter = THREE.LinearFilter;
					labelTexture.needsUpdate = true;

					var labelSpriteMaterial = new THREE.SpriteMaterial({
						map: labelTexture,
						useScreenCoordinates: false,
						transparent: true,
					});
					if (typeof opacity === 'undefined' || !opacity)
						labelSpriteMaterial.opacity = 0.7;
					else
						labelSpriteMaterial.opacity = opacity;

					// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
					// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
					labelSpriteMaterial.depthWrite = false;
					labelSpriteMaterial.depthTest = false;

					labelSprite = new THREE.Sprite(labelSpriteMaterial);

					// Set the scale with the ratio of the width/height of the canvas.
					if (labelCanvas.height != 0)
						var aspectRatio = labelCanvas.width / labelCanvas.height;
					else
						var aspectRatio = 1;
					var scaleX = 40;

					// Increase or decrease the scale proportional to the width of the canvas
					// Use 0.232 as the factor. The base width is 500 canvas width to 40 scaleX.
					var scX = ((labelCanvas.width - 500) / 40) * 2;
					scaleX = (scaleX + scX)

					// Increase or decrease the scale proportional to the width of the window size.
					// The baseline width is 1600.

					var scaleY = scaleX / aspectRatio;

					labelSprite.scale.set(scaleX, scaleY, 1.0);
					labelSprite.position.set(x, y, z);

					// Add the conditions, so we can reference it later when variables get changed, and we may need to hide/show the label.
					labelSprite.conditions = conditions;

					// We're adding the sprite to the scene here instead of in drawHotspotLabels(),
					// since with the img.onload() it would get added before the sprite is even created.
					activeScene.labelSprites.push(labelSprite);
					scene.add(labelSprite);
					labelSpriteMaterial.dispose();
					labelTexture.dispose();
				}

				// Change this PNG path to a configuration parameter that's set in a common file.
				img.src = "/assets/images/hotspot-default-transparent.png";
			}
			return labelSprite;
		}

		scope.createLabel = function(text, x, y, z, size, color, style)
		{
			var textCanvas = scope.createTextCanvas();
			if (textCanvas)
			{
				var ctx = textCanvas.getContext('2d');
				var fontStr = style + ' ' + size + 'px Open Sans';
				ctx.font = fontStr;

				// Retrieve the text width and height. Supposedly you can get a very close approximation of the vertical
				// height by checking the length of a capital M.
				// TODO: This is dumb. Get the height another way.
				var metrics = ctx.measureText(text);
				var textWidth = Math.ceil(metrics.width);
//				var textHeight = ctx.measureText('M').width * 0.9;
				var textHeight = size;

				ctx.font = fontStr;

				ctx.rect(0, 0, textCanvas.width, textCanvas.height);
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 3;
				ctx.strokeText(text, 0, size);
				ctx.fillStyle = 'white';
				ctx.fillText(text, 0, size);

				// Use the text canvas as a texture and sprite.
				var textTexture = new THREE.Texture(textCanvas);
				textTexture.minFilter = THREE.LinearFilter;
				textTexture.needsUpdate = true;
			
				var textSpriteMaterial = new THREE.SpriteMaterial({
					map: textTexture,
					useScreenCoordinates: false,
					transparent: true,
				});

				// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
				// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
				textSpriteMaterial.depthWrite = false;
				textSpriteMaterial.depthTest = false;
				
				// TODO: Scale to size of window and center.
				var textSprite = new THREE.Sprite(textSpriteMaterial);

				textSprite.scale.set(50, 25, 1.0);
//				textSprite.scale.set(textWidth, textHeight, 1.0);
				textSprite.position.set(x, y, z);
				textSprite.opacity = 1.0;
//				activeEvents[i].actions[a].textSprite = textSprite;
//				activeScene.textSprites.push(textSprite);
			
//				camera.add(textSprite);
//				scene.add(textSprite);
				return textSprite;
			}
		}

		var countdownCanvas;
		var countdownContext;
		var countdownImageData;
		var countdownTexture;
		var countdownMaterial;
		var countdownSpriteCanvasContext;

		scope.prefetchMedia = function()
		{
		}



		// Although we're using Howler.js for audio, we're still creating this fake audio player, so when the media is allowed
		// via the screen press on mobile browsers, this can play and stop as normal.
		// TODO: Is this necessary?
		scope.createAudioPlayer = function()
		{
			audioPlayer = document.createElement('audio');
			audioPlayer.id = 'audioPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			audioPlayer.src = '/assets/audio/blank.mp3';	// TODO: Add multiple sources?
			audioPlayer.autoplay = false;
			audioPlayer.loop = false;
			audioPlayer.width = 0;
			audioPlayer.height = 0;
			element[0].appendChild(audioPlayer);
		}



		// We'll want to create a system where videos can be paused and resumed immediately when other videos
		// load. There might be problems with mobile devices playing more than one video simultaneously since
		// only one video should be running at a time according to the HTML5 spec.

		// We may need to play and immediately stop all video player when first loading a scene.
		scope.createVideoPlayer = function()
		{
			videoPlayer = document.createElement('video');
			videoPlayer.id = 'videoPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			videoPlayer.src = '/assets/video/blank.mp4';	// TODO: Add multiple sources?
			videoPlayer.autoplay = false;
			videoPlayer.loop = false;
			videoPlayer.width = 0;
			videoPlayer.height = 0;
			element[0].appendChild(videoPlayer);
		}



		// TODO: Should this be put in a scope.$watch() function?
		scope.executeActions = function()
		{
//			if (showLoadingScreen == true)
//				return;

			var eventIndexesToRemove = [];

			if (activeEvents.length > 0)
			{
				// Parse through every action sequence we're processing and find any new actions that need to be executed.
				for (var i = 0; i < activeEvents.length; i++)
				{
					var evt = activeEvents[i];
	
					// When actions in the sequence are complete, they are flagged as "complete." While an action is in
					// progress, add an "inProgress" variable to it and set it to "true."
					// TODO: Remove actions from the array, so we're always just looking at the first item in the array?
					if (evt.actions)
					{
						var totalActionsCompleted = 0;
						for (var a = 0; a < evt.actions.length; a++)
						{
							// Check for conditions on the action. If an action doesn't meet a condition, mark it as complete.
							var conditionFlag = true;
							if (typeof evt.actions[a].conditions !== 'undefined' && evt.actions[a].conditions.length > 0)
							{
								var cond = evt.actions[a].conditions;
								for (var c = 0; c < cond.length; c++)
								{ 
									if (cond[c].type == 'variable')
									{
										var varIndex = variablesIndexes.indexOf(cond[c].variableName);
										if (varIndex != -1)
										{
											// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
											// TODO: Take strings and numbers into account so we don't run into errors.
											if (cond[c].variableOperator == '=')
											{
												if (variables[varIndex].value != cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '!=')
											{
												if (variables[varIndex].value == cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '>')
											{
												if (variables[varIndex].value <= cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '<')
											{
												if (variables[varIndex].value >= cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
										}
									}
								}
							}
							if (conditionFlag == false)
							{
								evt.actions[a].complete = true;
							}

							if (evt.actions[a].complete == true)
							{
								totalActionsCompleted++;
							}
							else if (typeof evt.actions[a].complete == 'undefined' || evt.actions[a].complete == false)
							{
								// If we don't yet have a complete variable for this action, or it's not yet complete (false)
								// that means this is the "current" action for this event and we don't need to continue any
								// more in this sequence. Add a complete variable and set it to "false" so we know we've started
								// the action, but it's still in progress.
								if (typeof evt.actions[a].complete == 'undefined')
								{
//									evt.actions[a].complete = false;
//									evt.actions[a].startTime = clock.getElapsedTime();
									activeEvents[i].actions[a].complete = false;
									activeEvents[i].actions[a].startTime = clock.getElapsedTime();
								}

								var setActionToComplete = false;

								// Process the action.

								//////////
								// JUMP //
								//////////
								if (evt.actions[a].actionType == 'jump' || evt.actions[a].type == 'jump')
								{
									scope.loadPage(evt.actions[a].targetId);
									setActionToComplete = true;
								}

								//////////////////
								// CHANGE LABEL //
								//////////////////
								// TODO: Add this to the "translate" action.
								else if (evt.actions[a].actionType == 'changeLabel')
								{
									setActionToComplete = true;
								}

								///////////
								// AUDIO //
								///////////
								else if (evt.actions[a].type == 'audio')
								{
/*
									if (typeof evt.actions[a].audioPlayer == 'undefined' || typeof evt.actions[a].audioPlayerId == 'undefined' || evt.actions[a].audioPlayerId == null)
									{
										var audioMediaFile = scope.getMediaFile(evt.actions[a].media);
										var audioSrc = audioMediaFile.filepath;

										// Set the volume.
										var audioVolume = 1.0;
										if (typeof evt.actions[a].volume !== 'undefined')
										{
											audioVolume = evt.actions[a].volume;
										}

										// If the "repeat" parameter is set for this action, set the audio player
										// to loop. Otherwise turn loop off.
										var audioLoop = false;
										if (typeof evt.actions[a].repeat !== 'undefined')
										{
											if (evt.actions[a].repeat == 1)
											{
												audioLoop = true;
											}
										}

										// TODO: Set the "html5" parameter to "true" if the audio file is large. See https://github.com/goldfire/howler.js/tree/2.0
										var audioHowl = new Howl({
											src: [audioSrc],
											loop: audioLoop,
											html5: false,
											volume: audioVolume,
											format: ['mp3'],
											onend: function()
											{
												// TODO: Fix it so repeating audio doesn't make it so events are never complete, and thus not
												// replayable.
												if (typeof evt.actions[a].repeat == 'undefined' || evt.actions[a].repeat == false)
												{
//													setActionToComplete = true;

													// Since we're using Howler's onend() event, we'll just set the action's "complete" attribute to "true" here.
													evt.actions[a].complete = true;
												}
											}
										});

										// Create a new unique id for this audio player. This is so we can tell
										// if the audio player is the same one we should be using for this action,
										// or if it was interrupted by something else, in which case we mark
										// this action as complete and continue the sequence.
										var audioPlayerId = 'audioPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
										activeEvents[i].actions[a].audioPlayerId = audioPlayerId;
										activeEvents[i].actions[a].audioPlayer = audioHowl;
										activeEvents[i].actions[a].audioPlayer.play();
									}
*/
									// Create a new unique id for this audio player. This is so we can tell
									// if the audio player is the same one we should be using for this action,
									// or if it was interrupted by something else, in which case we mark
									// this action as complete and continue the sequence.
									if (typeof evt.actions[a].audioPlayerId === 'undefined' || evt.actions[a].audioPlayerId == null)
									{
										audioPlayer.id = 'audioPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
										activeEvents[i].actions[a].audioPlayerId = audioPlayer.id;

										// Set the source to the audio player, overriding whatever is currently there.
										var audioMediaFile = scope.getMediaFile(evt.actions[a].media);
										audioPlayer.src = audioMediaFile.filepath;

										// Set the volume.
										if (typeof evt.actions[a].volume !== 'undefined')
										{
											audioPlayer.volume = evt.actions[a].volume;
										}
										else
										{
											audioPlayer.volume = 1.0;
										}

										// If the "repeat" parameter is set for this action, set the audio player
										// to loop. Otherwise turn loop off.
										audioPlayer.loop = false;
										if (typeof evt.actions[a].repeat !== 'undefined')
										{
											if (evt.actions[a].repeat == 1)
											{
												audioPlayer.loop = true;
											}
										}

										audioPlayer.play();
									}

									// If the audio has ended (check the id to make sure we're still playing the
									// right audio and it wasn't interrupted by something else), mark this action as
									// complete, unless we're supposed to repeat it.
									if (audioPlayer.id == activeEvents[i].actions[a].audioPlayerId && audioPlayer.ended)
									{
										// TODO: Fix it so repeating audio doesn't make it so events are never complete, and thus not
										// replayable.
										if (typeof evt.actions[a].repeat !== 'undefined' && evt.actions[a].repeat == true)
										{
											audioPlayer.play();
										}
										else
										{
											setActionToComplete = true;
										}
									}

									if (audioPlayer.id != activeEvents[i].actions[a].audioPlayerId)
									{
										setActionToComplete = true;
									}
								}

								///////////
								// VIDEO //
								///////////
/*
								else if (evt.actions[a].actionType == 'video')
								{
									// Set up the video if we need to.
									if (typeof evt.actions[a].videoCanvas == 'undefined')
									{
										// If we don't have a file path, disregard this action altogether.
										if (typeof evt.actions[a].actionFile.filePath == 'undefined')
										{
											setActionToComplete = true;
										}
										else
										{
											var videoCanvas = scope.createVideoPlayer();
										}

										videoPlayer.id = 'videoPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
										activeEvents[i].actions[a].videoPlayerId = videoPlayer.id;

										// Set the source to the audio player, overriding whatever is currently there.
										videoPlayer.src = evt.actions[a].actionFile.filePath;

										// Set the volume.
										if (typeof evt.actions[a].actionVolume !== 'undefined')
										{
											videoPlayer.volume = evt.actions[a].actionVolume;
										}
										else
										{
											videoPlayer.volume = 1.0;
										}
										videoPlayer.play();
									}

									// Check if we've reached the end of the video. If we have, mark this action as
									// complete, unless we're supposed to repeat it.
									if (videoPlayer.id == activeEvents[i].actions[a].videoPlayerId && videoPlayer.ended)
									{
									}
								}
*/
								else if (evt.actions[a].type == 'video')
								{
									// Set up the spritemap if we need to.
									if (typeof evt.actions[a].videoObject == 'undefined')
									{
										// We're setting the startTime here instead of repeatedly checking if it's been set
										// in update(), since this will save us some processing time.
										// Don't set the startTime in the scope.activeHotspot.countdownSpritemap object.
										// This could have some unexpected results.
										var videoData = evt.actions[a];
										videoData.startTime = clock.getElapsedTime();

										// If an action duration is specified, that means even if the sprite animation repeats,
										// it will only do so until the action duration is reached, regardless of the spritemap
										// duration.

										var videoObject = scope.createVideoObject(videoData, videoPlayer);

										if (videoObject)
										{
											activeEvents[i].actions[a].videoObject = videoObject;
											activeScene.videoSprites.push(videoObject);
										}
									}
								}

								///////////
								// IMAGE //
								///////////
								else if (evt.actions[a].type == 'image')
								{
									// Set up the image if we need to.
									if (typeof evt.actions[a].imageCanvas == 'undefined')
									{
										// If we don't have a file path, disregard this action altogether.
										var imageMediaFile = scope.getMediaFile(evt.actions[a].media);
										if (!imageMediaFile)
										{
											setActionToComplete = true;
										}
										else
										{
											var imageCanvas = scope.createImageCanvas();
											if (imageCanvas)
											{
												activeEvents[i].actions[a].imageCanvas = imageCanvas;
												var imageTexture = THREE.ImageUtils.loadTexture(imageMediaFile.filepath);
												imageTexture.minFilter = THREE.LinearFilter;
												imageTexture.needsUpdate = true;

												// If the placement is "fixed" this is a sprite attached to the scene.
												// If the placement is "overlay" this is a sprite attached to the camera.
												if (evt.actions[a].placement == 'overlay')
												{
													// Create the sprite and use screen coordinates.
													var imageSpriteMaterial = new THREE.SpriteMaterial({
														map: imageTexture,
//														transparent: true
													});
													var imageSprite = new THREE.Sprite(imageSpriteMaterial);

													// TODO: We need to consider the resolution of the device, so the scale
													// should take into account the width and height of the viewing area when
													// creating the baseline, instead of just using 100 for scaleX and scaleY.
													var scaleX = 100;
													var scaleY = 100;
													if (typeof evt.actions[a].media.scaleX !== 'undefined')
														scaleX *= evt.actions[a].media.scaleX;
													if (typeof evt.actions[a].media.scaleY !== 'undefined')
														scaleY *= evt.actions[a].media.scaleY;
													imageSprite.scale.set(scaleX, scaleY, 1.0);

//													var imageWidth = imageSpriteMaterial.map.image.width / 2;
//													var imageHeight = imageSpriteMaterial.map.image.height / 2;
													var imageWidth = 1606 / 2;
													var imageHeight = 1568 / 2;

													// Determine how the image should be aligned. Default to center (0, 0).
													// The formula is vertical alignment then horizontal alignment, e.g. "bottom center."
													var positionX = 0;
													var positionY = 0;
													if (typeof evt.actions[a].alignment !== 'undefined')
													{
														// Display the sprite as a HUD.
														// See http://threejs.org/examples/webgl_sprites.html
														// (Deprecated?) Also see http://stemkoski.github.io/Three.js/Sprites.html

														// Calculate the viewable width and height for the camera.
														// See http://stackoverflow.com/questions/13350875/three-js-width-of-view
/*
														var dist = 50;										// distance from camera
														var vFOV = camera.fov * Math.PI / 180;				// convert vertical fov to radians
														var height = 2 * Math.tan( vFOV / 2 ) * dist;		// visible height
														var aspect = domElement.width / domElement.height;
														var width = height * aspect;						// visible width
*/
														var width = window.innerWidth / 2;
														var height = window.innerHeight / 2;

														// To align properly, use a separate scene and render with an orthographic camera.
														// See http://stackoverflow.com/questions/20601102/three-spritealignment-showing-up-as-undefined
														var alignment = evt.actions[a].alignment.split(' ');

														if (typeof alignment[0] !== 'undefined')
														{
															if (alignment[0] == 'top')
															{
																positionY = height - imageHeight;
															}
															else if (alignment[0] == 'bottom')
															{
																positionY = - height + imageHeight;
															}
															else
																positionY = 0;
														}
//														else
//															positionY = 0;

														if (typeof alignment[1] !== 'undefined')
														{
															if (alignment[0] == 'left')
															{
																positionX = - width + imageWidth;
															}
															else if (alignment[0] == 'right')
															{
																positionX = width - imageWidth;
															}
															else
																positionX = 0;
														}
//														else
//															positionX = 0;
													}
//													imageSprite.position.set(positionX, positionY, 1);
													imageSprite.position.set(0, 0, -75);
//													imageSprite.opacity = 0.5;

													activeEvents[i].actions[a].imageSprite = imageSprite;
													activeScene.imageSprites.push(imageSprite);
//													overlayScene.add(imageSprite);
													camera.add(imageSprite);
												}
												else if (evt.actions[a].placement == 'fixed')
												{
													// Create the sprite and use screen coordinates.
													var imageSpriteMaterial = new THREE.SpriteMaterial({
														map: imageTexture,
//														transparent: true
													});
													imageSpriteMaterial.depthWrite = false;
													imageSpriteMaterial.depthTest = false;

													var imageSprite = new THREE.Sprite(imageSpriteMaterial);

													var scaleX = 100;
													var scaleY = 100;
													if (typeof evt.actions[a].media.scaleX !== 'undefined')
													{
														// Use the action-defined scaleX, if it exists. Otherwise, use the media's scaleX.
														if (typeof evt.actions[a].scaleX !== 'undefined')
															scaleX *= evt.actions[a].scaleX;
														else
															scaleX *= evt.actions[a].media.scaleX;
													}
													if (typeof evt.actions[a].media.scaleY !== 'undefined')
													{
														// Use the action-defined scaleY, if it exists. Otherwise, use the media's scaleY.
														if (typeof evt.actions[a].scaleY !== 'undefined')
															scaleY *= evt.actions[a].scaleY;
														else
															scaleY *= evt.actions[a].media.scaleY;
													}
													imageSprite.scale.set(scaleX, scaleY, 1.0);
													imageSprite.position.set(evt.actions[a].positionX, evt.actions[a].positionY, evt.actions[a].positionZ);

													activeEvents[i].actions[a].imageSprite = imageSprite;
													activeScene.imageSprites.push(imageSprite);
													scene.add(imageSprite);
												}
												else
												{
													setActionToComplete = true;
												}
											}
										}
									}

									// Check if we've reached the duration of the image. If duration is 0, then we're leaving
									// the image up permanently and can just continue on.
									if (evt.actions[a].duration > 0)
									{
										var checkTime = evt.actions[a].startTime + (evt.actions[a].duration / 1000);
										if (clock.getElapsedTime() > checkTime)
										{
											// Remove the image canvas and set this action to complete.
											camera.remove(activeEvents[i].actions[a].imageSprite);
											setActionToComplete = true;
										}
									}
									else
									{
										setActionToComplete = true;
									}
								}

								///////////////
								// SPRITEMAP //
								///////////////
								else if (evt.actions[a].type == 'spritemap')
								{
									// Spritemaps are a little different than other assets. They don't use any canvases
									// for rendering, but just a spritemap texture and a custom update() function that
									// determines which tile to display.

									// Set up the spritemap if we need to.
									if (typeof evt.actions[a].spritemapAnimation == 'undefined')
									{
										// We're setting the startTime here instead of repeatedly checking if it's been set
										// in update(), since this will save us some processing time.
										// Don't set the startTime in the scope.activeHotspot.countdownSpritemap object.
										// This could have some unexpected results.
										var spritemapData = evt.actions[a];
										spritemapData.startTime = clock.getElapsedTime();

										// If an action duration is specified, that means even if the sprite animation repeats,
										// it will only do so until the action duration is reached, regardless of the spritemap
										// duration.
										var spritemapAnimation = scope.createSpritemapAnimator(spritemapData);
										if (spritemapAnimation)
										{
											activeEvents[i].actions[a].spritemapAnimation = spritemapAnimation;
											activeScene.spritemaps.push(spritemapAnimation);
										}
									}
								}

								//////////
								// TEXT //
								//////////
								else if (evt.actions[a].type == 'text')
								{
									// TODO: Interrupt any existing text elements attached to the camera.

									// Set up the text if we need to.
									if (typeof evt.actions[a].textCanvas == 'undefined')
									{
										var textCanvas = scope.createTextCanvas();

										// TODO: Account for positioned text. Right now we're just allowing overlay text.
										// We may not even want to allow positioned text, since these could also just be
										// hotspot labels without any actions. Positioned text shouldn't use the textCanvas
										// overlays on top of the scene, but three.js sprites created from text, like
										// labels are now.
										// UPDATE: It's too much of a pain to use overlays this way, since we can resize
										// the window, as well as switch between desktop and VR modes. We need to convert
										// these to sprites, and figure out how to calculate and resize the width properly
										// so the font size is consistent.
//										textCanvas.className += ' overlay';

										if (textCanvas)
										{
											activeEvents[i].actions[a].textCanvas = textCanvas;

											var ctx = evt.actions[a].textCanvas.getContext('2d');

											if (typeof evt.actions[a].textFontSize === 'undefined')
												evt.actions[a].textFontSize = 24;

											if (typeof evt.actions[a].textFontColor === 'undefined')
												evt.actions[a].textFontColor = 'white';

											if (typeof evt.actions[a].textFontStyle === 'undefined')
												evt.actions[a].textFontStyle = '';

											var fontStr = evt.actions[a].textFontStyle + ' ' + evt.actions[a].textFontSize + 'px Open Sans';
											ctx.font = fontStr;

											wrapText(ctx, renderer, evt.actions[a].text, evt.actions[a].textFontSize, evt.actions[a].textFontColor, evt.actions[a].textFontStyle, 0.5);
/*
											// Get the camera's viewable width and height.
											var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
											var height = 2 * Math.tan( vFOV / 2 ) * 100; // visible height
											var aspect = element[0].width / element[0].height;
											var width = height * aspect;                  // visible width
*/
											// Copy the canvas to a square text canvas, so it displays properly as a sprite, and center-align it.
											var newTextCanvas = scope.createTextCanvas();
											if (textCanvas.width > textCanvas.height)
											{
												newTextCanvas.width = textCanvas.width;
												newTextCanvas.height = textCanvas.width;
											}
											else
											{
												newTextCanvas.width = textCanvas.height;
												newTextCanvas.height = textCanvas.height;
											}
											var nctx = newTextCanvas.getContext('2d');
											nctx.drawImage(textCanvas, (newTextCanvas.width - textCanvas.width) / 2, (newTextCanvas.height - textCanvas.height) / 2);

											// Use the text canvas as a texture and sprite.
											var textTexture = new THREE.Texture(newTextCanvas);
											textTexture.minFilter = THREE.LinearFilter;
											textTexture.needsUpdate = true;

											var textSpriteMaterial = new THREE.SpriteMaterial({
												map: textTexture,
												transparent: true,
											});

											// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
											// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
											textSpriteMaterial.depthWrite = false;
											textSpriteMaterial.depthTest = false;

											var textSprite = new THREE.Sprite(textSpriteMaterial);
											textSprite.scale.set(100, 100, 1.0);
											textSprite.position.set(0, 0, -95);
											textSprite.opacity = 1.0;
											activeEvents[i].actions[a].textSprite = textSprite;
											activeScene.textSprites.push(textSprite);

											// TODO: Center text on the screen.
											// See http://chimera.labs.oreilly.com/books/1234000001654/ch03.html#communicating_between_html_forms_and_the

											// TODO: Allow "fixed" text to be used, so it stays at specific coordinates.
											camera.add(textSprite);
//											scene.add(evt.actions[a].textSprite);
										}
									}

									// Check if we've completed the in-transition, if applicable. If no duration is specified,
									// default to 1000 milliseconds.
									if (typeof evt.actions[a].actionTextInTransition !== undefined)
									{
										var inDuration = 0;
										if (typeof evt.actions[a].actionTextInTransitionDuration === undefined)
										{
											activeEvents[i].actions[a].actionTextInTransitionDuration = 1000;
											inDuration = 1000;
										}
										else
										{
											inDuration = evt.actions[a].actionTextInTransitionDuration;
										}

										var currentTime = clock.getElapsedTime();
										if (typeof evt.actions[a].startTimeTextInTransition === undefined)
										{
											activeEvents[i].actions[a].startTimeTextInTransition = currentTime;
										}

										if (typeof evt.actions[a].endTimeTextInTransition === undefined)
										{
											activeEvents[i].actions[a].endTimeTextInTransition = currentTime + inDuration;
										}

										if (typeof evt.actions[a].textCanvas !== undefined)
										{
											// Fade in.
											if (evt.actions[a].actionTextInTransition == 'fadeIn')
											{
												var opacity = 1 / (evt.actions[a].endTimeTextInTransition - currentTime);
												ctx.font = '24px Open Sans';
												ctx.strokeStyle = 'rgba(0, 0, 0, 0.0)';
												ctx.lineWidth = 2;
												ctx.strokeText(evt.actions[a].text, 20, 20);
												ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
												ctx.fillText(evt.actions[a].text, 20, 20);
												ctx.textAlign = 'center';
												ctx.textBaseline = 'middle';
											}
										}
									}

									// Check if we've reached the duration of the text once the in-transition is finished, if
									// one exists. If duration is 0, then we're leaving the text up permanently and can just
									// continue on.
//									if (evt.actions[a].actionDuration && !isNaN(evt.actions[a].actionDuration) && evt.actions[a].actionDuration > 0)

									if (typeof evt.actions[a].actionTextInTransition !== undefined && evt.actions[a].startTimeTextInTransition > 0)
									{
									}

									if (evt.actions[a].duration > 0)
									{
										var checkTime = evt.actions[a].startTime + (evt.actions[a].duration / 1000);
										if (clock.getElapsedTime() > checkTime)
										{
											// Remove the text canvas and set this action to complete.
											camera.remove(activeEvents[i].actions[a].textSprite);
											setActionToComplete = true;
										}
									}
									else
									{
									}

									// Check if we've completed the out-transition, if applicable. If no duration is specified,
									// default to 1000 milliseconds.
								}

								//////////
								// WAIT //
								//////////
								else if (evt.actions[a].type == 'wait')
								{
									// Don't process this if a duration isn't set, or is 0 or less.
									if (typeof evt.actions[a].duration === 'undefined' || evt.actions[a].duration <= 0)
									{
										setActionToComplete = true;
									}
									else
									{
										// Set a timer if we don't have one.
										if (typeof evt.actions[a].startTime === 'undefined' || evt.actions[a].startTime == null)
										{
											evt.actions[a].startTime = clock.getElapsedTime();
										}
										else
										{
											var currentTime = clock.getElapsedTime();
											if (currentTime - evt.actions[a].startTime > (evt.actions[a].duration / 1000))
											{
												setActionToComplete = true;
											}
										}
									}
								}

								//////////////
								// VARIABLE //
								//////////////
								else if (evt.actions[a].type == 'variable')
								{
									// Make sure the global variable exists in the project.
									// TODO: Save these into the scope so Angular can process and send them to the back-end for storing when they're changed.
									// TODO: Take strings and numbers into account.
									var varIndex = variablesIndexes.indexOf(evt.actions[a].name);
									if (varIndex != -1)
									{
										if (evt.actions[a].operator == 'set')
										{
											variables[varIndex].value = evt.actions[a].operand;
										}

										// Everything else requires that the variable value be numeric.
										else if (!isNaN(variables[varIndex].value) && !isNaN(evt.actions[a].operand))
										{
											var numValue = Number(variables[varIndex].value);
											var numOperand = Number(evt.actions[a].operand);
											if (evt.actions[a].operator == '+')
											{
												variables[varIndex].value = numValue + numOperand;
											}
											else if (evt.actions[a].operator == '-')
											{
												variables[varIndex].value = numValue - numOperand;
											}
											else if (evt.actions[a].operator == '*')
											{
												variables[varIndex].value = numValue * numOperand;
											}
											else if (evt.actions[a].operator == '/')
											{
												variables[varIndex].value = numValue / numOperand;
											}
											else if (evt.actions[a].operator == '%')
											{
												variables[varIndex].value = numValue % numOperand;
											}
										}

										// Check all existing hotspots in the scene and make sure the conditions for them
										// haven't changed. If they have, and the condition is now false, hide the labels and
										// make them inactive. Otherwise, show the labels. Only check hotspots that use the
										// just-altered variable as one of the conditions.
										for (var l = 0; l < activeScene.labelSprites.length; l++)
										{
											if (typeof activeScene.labelSprites[l].conditions !== 'undefined')
											{
												for (var ca = 0; ca < activeScene.labelSprites[l].conditions.length; ca++)
												{
													var condition = activeScene.labelSprites[l].conditions[ca];
													if (condition.variableName == evt.actions[a].name)
													{
														// Check the condition of the hotspot (label), and hide/show accordingly.
														var conditionFlag = true;

														// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
														// TODO: Take strings and numbers into account so we don't run into errors.
														if (condition.variableOperator == '=')
														{
															if (variables[varIndex].value != condition.variableOperand)
															{
																conditionFlag = false;
															}
														}
														else if (condition.variableOperator == '!=')
														{
															if (variables[varIndex].value == condition.variableOperand)
															{
																conditionFlag = false;
															}
														}
														else if (condition.variableOperator == '>')
														{
															if (variables[varIndex].value <= condition.variableOperand)
															{
																conditionFlag = false;
															}
														}
														else if (condition.variableOperator == '<')
														{
															if (variables[varIndex].value >= condition.variableOperand)
															{
																conditionFlag = false;
															}
														}
//														console.log(conditionFlag);
													}
												}
											}
										}
									}
									setActionToComplete = true;
								}

								///////////////
								// TRANSLATE //
								///////////////
								else if (evt.actions[a].type == 'translate')
								{
									// A translation is the movement of the object in an image, video, or spritemap action.
									// Attributes can be overridden as well. A "targetId" must be specified, or this action
									// will be bypassed. Also, the original action must still be running, or this won't work.
									if (typeof evt.actions[a].targetId === undefined)
									{
										setActionToComplete = true;
									}
									else
									{
										// If we're already translating an object, then we'll have added the spriteAnimator object
										// to this event, with all the data and "translating" set to "true."
										if (typeof evt.actions[a].spritemapAnimator !== 'undefined')
										{
											if (evt.actions[a].spritemapAnimator.translating == false)
											{
												evt.actions[a].spritemapAnimator.translatePath = null;
												evt.actions[a].spritemapAnimator.translateScaleX = null;
												evt.actions[a].spritemapAnimator.translateScaleY = null;
												evt.actions[a].spritemapAnimator.translateScaleDiffX = null;
												evt.actions[a].spritemapAnimator.translateScaleDiffY = null;
												setActionToComplete = true;
											}
										}
										else
										{
											// Parse through activeEvents and find the action we're translating.
											// TODO: These arrays need to be better organized so we're not parsing through everything.
											// The objects could be labeled as the id.
											var targetActionFound = false;
											for (var e = 0; e < activeEvents.length; e++)
											{
												if (typeof activeEvents[e].actions !== 'undefined')
												{
													for (var z = 0; z < activeEvents[e].actions.length; z++)
													{
														if (activeEvents[e].actions[z].id == evt.actions[a].targetId)
														{
															targetActionFound = true;
															var originalAction = activeEvents[e].actions[z];
	
															// Make sure the placement is "fixed."
															if (originalAction.placement == 'fixed')
															{
																var startPosition = new THREE.Vector3();
																var destPosition = new THREE.Vector3();
																var originalSource;		// The item containing the object. This could be the object itself.
																var originalObject;
	
																if (originalAction.type == 'image') {}
																else if (originalAction.type == 'video') {}
																else if (originalAction.type == 'audio') {}
																else if (originalAction.type == 'spritemap')
																{
																	if (typeof originalAction.spritemapAnimation !== 'undefined')
																	{
																		originalSource = originalAction.spritemapAnimation;
																		originalObject = originalAction.spritemapAnimation.sprite;
	
																		// Replace the action with any new parameters.
																		if (typeof evt.actions[a].spritemapTileSequence !== 'undefined')
																			originalSource.spritemapTileSequence = evt.actions[a].spritemapTileSequence;
																		if (typeof evt.actions[a].spritemapRepeat !== 'undefined')
																			originalSource.spritemapRepeat = evt.actions[a].spritemapRepeat;
																		if (typeof evt.actions[a].spritemapDuration !== 'undefined')
																			originalSource.spritemapDuration = evt.actions[a].spritemapDuration;
																	}
																}

																if (typeof originalObject === 'undefined')
																{
																	e = activeEvents.length;	// This will break out of the parent loop.
																	break;
																}

																// If there's any position attributes, make sure we have one for X, Y, and Z.
																if (typeof evt.actions[a].positionX !== 'undefined' && typeof evt.actions[a].positionY !== 'undefined' && typeof evt.actions[a].positionZ !== 'undefined')
																{
																	// Create a spline between the two points with a diameter the same as the sphere.
																	// QuadraticBezierCurve3
																	// Find the current real-world position from the object's matrixWorld.
																	scene.updateMatrixWorld(true);
																	startPosition.setFromMatrixPosition(originalObject.matrixWorld);
																	destPosition = new THREE.Vector3(evt.actions[a].positionX, evt.actions[a].positionY, evt.actions[a].positionZ);
																	var middle = new THREE.Vector3((startPosition.x + destPosition.x) / 2, (startPosition.y + destPosition.y) / 2, (startPosition.z + destPosition.z) / 2);
	
																	// Create a raycaster that looks in the direction of the midpoint, and finds where
																	// the background sphere is behind it.
																	// TODO: There has to be a better way to have a raycaster facing a point than creating
																	// a new camera and using lookAt(). Figure it out.
																	var backgroundObject = scene.getObjectByName('sceneBackground');
																	var tempCamera = new THREE.PerspectiveCamera(90, (contW / 2) / contH, 0.001, 1000);
																	tempCamera.position.set(0, 0, 0);
																	tempCamera.lookAt(middle);
																	var directionVector = new THREE.Vector3(0, 0, -1).applyQuaternion(tempCamera.quaternion);
																	var raycaster = new THREE.Raycaster(tempCamera.position, directionVector.normalize());
																	scene.remove(tempCamera);
																	var intersection = raycaster.intersectObject(backgroundObject, true);
																	var curve = new THREE.QuadraticBezierCurve3(startPosition, intersection[0].point, destPosition);
																	var path = new THREE.CurvePath();
																	path.add(curve);
	/*
																	var curveMaterial = new THREE.LineBasicMaterial({
																		color: 0xFF0000
																	});
																	var curvedLine = new THREE.Line(path.createPointsGeometry(20), curveMaterial);
																	scene.add(curvedLine);
	*/
																	// Add the translation information to the object. An object can only
																	// have one set of translation parameters at a given time, i.e. it
																	// can only be moving or scaling in one direction. If we need to cancel
																	// this mid-translation later, we have to use a cancel action on the
																	// translation action.
																	originalSource.translatePath = path;
																}
	
																if (typeof evt.actions[a].translateScaleX !== 'undefined')
																{
																	originalSource.sourceScaleX = originalSource.scaleX;
																	originalSource.translateScaleX = evt.actions[a].translateScaleX;
																}
																if (typeof evt.actions[a].translateScaleY !== 'undefined')
																{
																	originalSource.sourceScaleY = originalSource.scaleY;
																	originalSource.translateScaleY = evt.actions[a].translateScaleY;
																}
																if (typeof evt.actions[a].translateDuration !== 'undefined')
																	originalSource.translateDuration = evt.actions[a].translateDuration;

																originalSource.translating = true;
																evt.actions[a].spritemapAnimator = originalSource;
															}
	
															e = activeEvents.length;	// This will break out of the parent loop.
															break;
														}
													}
												}
											}
										}

										if (targetActionFound == false)
											setActionToComplete = true;
									}
								}

								////////////
								// CANCEL //
								////////////
								// TODO: Add methods to cancel a translation. Basically this should remove any movement or scaling
								// paramters from an image, video, or spritemap.
								else if (evt.actions[a].type == 'cancel')
								{
									// There is an id set in the params that indicates a specific action to cancel
									// (i.e. mark as complete). We do not restrict this only to actions in the same
									// event sequence, but this sort of restriction logic may be implemented in the editor.
									var targetActionId = evt.actions[a].targetId;

									// Find the action id in the actions, and set the action to complete.
									// TODO: We may want to use the cancelActions global array instead of reparsing the activeEvents
									// right here, so the cancellation occurs within the normal flow of the actions execution.
									for (var j = 0; j < activeEvents.length; j++)
									{
										if (activeEvents[j].actions)
										{
											for (var b = 0; b < activeEvents[j].actions.length; b++)
											{
												if (activeEvents[j].actions[b].id == targetActionId)
												{
													// We'll need to do different things depending on the type of action we're cancelling.

													// If this is a text action, remove the text canvas.
													if (activeEvents[j].actions[b].type == 'text')
													{
														camera.remove(activeEvents[j].actions[b].textSprite);
													}

													// If this is an image action, remove the image canvas.
													else if (activeEvents[j].actions[b].type == 'image')
													{
														camera.remove(activeEvents[j].actions[b].imageSprite);
													}
													activeEvents[j].actions[b].complete = true;
												}
											}
										}
									}
									setActionToComplete = true;		// Don't run this cancel action again.
								}

								// Set the action to complete if we need to.
								if (setActionToComplete == true && typeof activeEvents[i] !== 'undefined')
								{
									if (typeof activeEvents[i].actions[a] !== 'undefined')
									{
										activeEvents[i].actions[a].complete = true;
									}
								}

								// If the action's continue flag is set to true, keep processing the next actions. Otherwise, break.
								if (evt.actions[a].continue == false)
								{
									// Don't continue on to any other actions in this event sequence.
									break;
								}
							}

							// Remove this event from the queue if all actions have been completed.
							// Also set "blockHotspots" to false if this event had it set.
							if (totalActionsCompleted >= evt.actions.length)
							{
								eventIndexesToRemove.push(i);

								if (typeof evt.blockHotspots !== 'undefined')
								{
									if (evt.blockHotspots == true)
									{
										blockHotspots = false;
									}
								}
							}
						}
					}
				}
			}

			for (var e = 0; e < eventIndexesToRemove.length; e++)
			{
				activeEvents.splice(e, 1);
			}

			// If activeScene has a jump flag set, and all the activeEvents are gone, we can call jumpToScene().
			if (typeof activeSceneJump !== 'undefined' && activeSceneJump != null)
			{
//				for (var z = 0; z < activeEvents.length; z++)
//				{
//					var evt = activeEvents[z];
//				}

				// Reset the events of the current scene in case we come back to it again later. Note that this is necessary
				// because Javascript passes variables as references instead of values, so ultimately the scope.activeProject
				// has stored the completion state of all these events.
				if (typeof activeScene.startEvents !== 'undefined')
				{
					for (var e = 0; e < activeScene.startEvents.length; e++)
					{
						if (typeof activeScene.startEvents[e].actions !== 'undefined')
						{
							for (var a = 0; a < activeScene.startEvents[e].actions.length; a++)
							{
								// Audio actions are unique, in that they may have a "persist" attribute, so the audio
								// keeps playing after a jump. If this is the case, the audio player should not be
								// nulled, and the action not completed. After the new scene loads, the audio action
								// continues.
								if (activeScene.startEvents[e].actions[a].type == 'audio')
								{
									if (typeof activeScene.startEvents[e].actions[a].persist !== 'undefined')
									{
										if (activeScene.startEvents[e].actions[a].persist == true)
										{
											audioPlayer.dataset.persist = 1;
//											console.log(audioPlayer);
											continue;
										}
									}
									else
									{
										// Stop playing the audio.
										if (typeof activeScene.startEvents[e].actions[a].audioPlayer !== 'undefined')
										{
											activeScene.startEvents[e].actions[a].audioPlayer.stop();
										}
									}
								}

								activeScene.startEvents[e].actions[a].complete = false;
								activeScene.startEvents[e].actions[a].startTime = null;

								// Clear out any media player ids so if the scene is revisted, they can play again.
//								if (typeof activeScene.startEvents[e].actions[a].audioPlayerId !== 'undefined')
								activeScene.startEvents[e].actions[a].audioPlayerId = null;
								activeScene.startEvents[e].actions[a].audioPlayer = null;
//								if (typeof activeScene.startEvents[e].actions[a].videoPlayerId !== 'undefined')
								activeScene.startEvents[e].actions[a].videoPlayerId = null;
								activeScene.startEvents[e].actions[a].videoPlayer = null;
							}
						}
					}
				}

				// TODO: Add persistent audio and clean up actions in endEvents before the jump.
				if (typeof activeScene.endEvents !== 'undefined')
				{
					for (var e = 0; e < activeScene.endEvents.length; e++)
					{
						if (typeof activeScene.endEvents[e].actions !== 'undefined')
						{
							for (var a = 0; a < activeScene.endEvents[e].actions.length; a++)
							{
								activeScene.endEvents[e].actions[a].complete = false;
							}
						}
					}
				}

				if (typeof activeScene.hotspots !== 'undefined')
				{
					for (var e = 0; e < activeScene.hotspots.length; e++)
					{
						if (typeof activeScene.hotspots[e].actions !== 'undefined')
						{
							for (var a = 0; a < activeScene.hotspots[e].actions.length; a++)
							{
								activeScene.hotspots[e].actions[a].complete = false;
							}
						}
					}
				}

				// Remove any text, image, and video canvases and scene objects that we need to.
				if (typeof activeScene.textSprites !== 'undefined')
				{
					for (var x = 0; x < activeScene.textSprites.length; x++)
					{
						camera.remove(activeScene.textSprites[x]);
					}
				}

				if (typeof activeScene.imageSprites !== 'undefined')
				{
					for (var x = 0; x < activeScene.imageSprites.length; x++)
					{
						camera.remove(activeScene.imageSprites[x]);
					}
				}

				if (typeof activeScene.videoSprites !== 'undefined')
				{
					for (var x = 0; x < activeScene.videoSprites.length; x++)
					{
						camera.remove(activeScene.videoSprites[x]);
					}
				}

				var newScene = activeSceneJump;
				activeSceneJump = null;

				// Preload the next scene's assets.
				scope.setPreloadAssetsForScene(newScene);
			}

			setTimeout(function()
			{
				currentAnimationFrameId = window.requestAnimationFrame(scope.executeActions);
			}, 1);
//			processing_executeActions = false;
		}



		scope.createTextCanvas = function()
		{
			var textCanvas = document.createElement('canvas');
			textCanvas.id = 'text_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			textCanvas.className = 'textCanvas';
//			textCanvas.width = element[0].clientWidth;
//			textCanvas.height = element[0].clientHeight;
			element[0].appendChild(textCanvas);
			return textCanvas;
		}



		scope.createImageCanvas = function()
		{
			var imageCanvas = document.createElement('canvas');
			imageCanvas.id = 'image_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			imageCanvas.className = 'imageCanvas';
			element[0].appendChild(imageCanvas);
			return imageCanvas;
		}



		// Process voice events.
		// TODO: Gather all the condition variables used for voice events, then monitor when they change.
		// If one does change, instantly restart annyang so the system is looking for the user to speak
		// a new word.
		// TODO: If all the voice events have conditions, test that at least one exists before
		// starting annyang. That way, we're not wasting resources.
		// TODO: Abort the listener when none of the conditions for any of the commands for the scene are met,
		// and start it again when they are, so we're not wasting resources.
		scope.listenVoiceEvents = function()
		{
			if (annyang)
			{
//				annyang.abort();

				// We need to fix this so it listens to specific commands the way annyang is supposed to work.
				// The problem is there doesn't seem to be a way to pass commands in dynamically, as well as
				// dynamic actions that should result.
				var command =
				{
					'*spherecast': function(result)
					{
						// See if what was said matches any voice events in the scene.
						var executeVoiceEvents = [];
						if (typeof activeScene.voiceEvents !== undefined)
						{
							for (var v = 0; v < activeScene.voiceEvents.length; v++)
							{
								if (typeof activeScene.voiceEvents[v].commands !== undefined)
								{
									for (var t = 0; t < activeScene.voiceEvents[v].commands.length; t++)
									{
										if (activeScene.voiceEvents[v].commands[t].commandText.toLowerCase() == result.toLowerCase())
										{
											var conditionFlag = true;
											if (typeof activeScene.voiceEvents[v].conditions !== undefined && activeScene.voiceEvents[v].conditions.length > 0)
											{
												var cond = activeScene.voiceEvents[v].conditions;
												for (var c = 0; c < cond.length; c++)
												{ 
													if (cond[c].type == 'variable')
													{
														var varIndex = variablesIndexes.indexOf(cond[c].variableName);
														if (varIndex != -1)
														{
															// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
															// TODO: Take strings and numbers into account so we don't run into errors.
															if (cond[c].variableOperator == '=')
															{
																if (variables[varIndex].value != cond[c].variableOperand)
																{
																	conditionFlag = false;
																}
															}
															else if (cond[c].variableOperator == '!=')
															{
																
																if (variables[varIndex].value == cond[c].variableOperand)
																{
																	conditionFlag = false;
																}
															}
															else if (cond[c].variableOperator == '>')
															{
																if (variables[varIndex].value <= cond[c].variableOperand)
																{
																	conditionFlag = false;
																}
															}
															else if (cond[c].variableOperator == '<')
															{
																if (variables[varIndex].value >= cond[c].variableOperand)
																{
																	conditionFlag = false;
																}
															}
														}
													}
												}
											}

											if (conditionFlag == true)
											{
												executeVoiceEvents.push(activeScene.voiceEvents[v]);
											}
										}
									}
								}
							}
						}
						console.log(result);
						console.log(executeVoiceEvents);

						if (executeVoiceEvents.length > 0)
						{
							for (var a = 0; a < executeVoiceEvents.length; a++)
							{
								activeEvents.push(executeVoiceEvents[a]);
							}
						}
						console.log(activeEvents);
						return;

						// Test conditions.
						var conditionFlag = true;
						if (typeof activeScene.voiceEvents[v].conditions !== undefined && activeScene.voiceEvents[v].conditions.length > 0)
						{
							var cond = activeScene.voiceEvents[v].conditions;
							for (var c = 0; c < cond.length; c++)
							{ 
								if (cond[c].type == 'variable')
								{
									var varIndex = variablesIndexes.indexOf(cond[c].variableName);
									if (varIndex != -1)
									{
										// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
										// TODO: Take strings and numbers into account so we don't run into errors.
										if (cond[c].variableOperator == '=')
										{
											if (variables[varIndex].value != cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '!=')
										{
											
											if (variables[varIndex].value == cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '>')
										{
											if (variables[varIndex].value <= cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '<')
										{
											if (variables[varIndex].value >= cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
									}
								}
							}
						}

						// Execute actions.
						if (conditionFlag == true)
						{
//							alert(this);
						}
					}
				};
				annyang.addCommands(command);

				// Add all the commands in the scene. Conditions will be processed inside the callbacks.
				for (var v = 0; v < activeScene.voiceEvents.length; v++)
				{
					for (var c = 0; c < activeScene.voiceEvents[v].commands.length; c++)
					{
						if (typeof activeScene.voiceEvents[v].commands[c].commandText !== 'undefined')
						{
							var commandText = activeScene.voiceEvents[v].commands[c].commandText;
							commandText = 'bookshelf';
						}
					}
				}
//				annyang.start({autoRestart: false, continuous: true});
			}
			else
			{
				// TODO: Error-handle. We'll probably want to inform the user at the beginning when we test
				// for compatibility that they simply can't use the spherecast with their current browser,
				// and have to use a different one.
			}
		}



		scope.executeVoiceCallback = function(e)
		{
//			alert('test');
//			alert(e);
		}



		// If the screen is touched, we need to first save the XY coordinates in touchstart, so when the touchend
		// event fires, we can compare coordinates.
		scope.touchScreenStartEvent = function(e)
		{
//			e.preventDefault();
			touchScreenDrag = false;
			touchScreenStartX = e.changedTouches[e.changedTouches.length - 1].pageX;
			touchScreenStartY = e.changedTouches[e.changedTouches.length - 1].pageY;
		}



		scope.touchScreenMoveEvent = function(e)
		{
//			e.preventDefault();
		}



		// If the screen is touched, check if we're (a) in an active scene, (b) any of the hotspots for the scene
		// have activateByTrigger set to true, a radius of -1,  and a duration of -1 to indicate a screenwide hotspot,
		// (c) the event is not already in the active queue, (d) the conditions for the hotspot are met, (d) if the
		// radius is specified, check that we're within the radius. Note that if duration is specified, a user could
		// use this to "speed up" the activation.
		scope.touchScreenEndEvent = function(e)
		{
//			e.preventDefault();

			// Check that touchmove didn't have any significant results.
			touchScreenEndX = e.changedTouches[e.changedTouches.length - 1].pageX;
			touchScreenEndY = e.changedTouches[e.changedTouches.length - 1].pageY;

			if (Math.abs(touchScreenStartX - touchScreenEndX) + Math.abs(touchScreenStartY - touchScreenEndY) > 5)
			{
				touchScreenDrag = true;
			}

			else if (typeof activeScene !== 'undefined')
			{
				if (typeof activeScene.hotspots !== 'undefined')
				{
					for (var h = 0; h < activeScene.hotspots.length; h++)
					{
						var hotspot = activeScene.hotspots[h];

						// Check if we're doing a screenwide hotspot.
						if (hotspot.activateByTrigger == true && parseInt(hotspot.radius, 10) == -1 && parseInt(hotspot.duration, 10) == -1)
						{
							// If the hotspot event is in the active event queue, don't try to check for it.
							// TODO: It might be faster to keep a separate array of just event ids.
							var eventIsInActiveQueue = false;
							if (typeof activeEvents !== 'undefined')
							{
								for (var i = 0; i < activeEvents.length; i++)
								{
									if (activeEvents[i].id == hotspot.id)
									{
										eventIsInActiveQueue = true;
									}
								}
							}
		
							if (eventIsInActiveQueue == true)
							{
								continue;
							}

							// Check the conditions. Note that this happens after the radius and duration check, since it's
							// more resource-intensive and not worth doing if the radius and duration aren't correct.
							// TODO: Move all condition checking into its own function.
							var conditionFlag = true;
							if (typeof hotspot.conditions !== 'undefined' && hotspot.conditions.length > 0)
							{
								var cond = hotspot.conditions;
								for (var c = 0; c < cond.length; c++)
								{ 
									if (cond[c].type == 'variable')
									{
										var varIndex = variablesIndexes.indexOf(cond[c].variableName);
										if (varIndex != -1)
										{
											// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
											// TODO: Take strings and numbers into account so we don't run into errors.
											if (cond[c].variableOperator == '=')
											{
												if (variables[varIndex].value != cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '!=')
											{
												if (variables[varIndex].value == cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '>')
											{
												if (variables[varIndex].value <= cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
											else if (cond[c].variableOperator == '<')
											{
												if (variables[varIndex].value >= cond[c].variableOperand)
												{
													conditionFlag = false;
												}
											}
										}
									}
								}
							}

							if (conditionFlag == true)
							{
								// If the event has "blockHotspots" set to true, set that now, then add the events to the queue.
								if (typeof hotspot.blockHotspots !== 'undefined')
								{
									if (hotspot.blockHotspots == true)
										blockHotspots = true;
									else
										blockHotspots = false;
								}
	
								// Add the actions to the queue.
								activeEvents.push(hotspot);
							}
						}

						// Check if we're doing a fixed position hotspot. Make sure we're within the radius before triggering.
						else if (hotspot.activateByTrigger == true && hotspot.radius > 0 && hotspot.duration >= 0)
						{
							// TODO: Finish this.
						}
					}
				}
			}
		}



		// Don't activate the countdown if the hotspot profile doesn't allow activating by looking.
		// TODO: Allow for more diverse hotspot profiles. Right now we're still using scope.mode, when we should
		// have a full-featured customizable profile instead.
		scope.scanHotspots = function()
		{
//			if (showLoadingScreen == true)
//				return;
		  if (blockHotspots == false)
		  {
//			if (typeof scope.activeScene === 'undefined' || typeof scope.activeScene.hotspots === 'undefined')
			var activateByLook = false;
			if (scope.mode == 'vr')
			{
				if (typeof scope.activeProject.hotspotProfileVR !== 'undefined')
					activateByLook = scope.activeProject.hotspotProfileVR.activateByLook;
				else
					activateByLook = true;
			}
			else
			{
				if (typeof scope.activeProject.hotspotProfileStandard !== 'undefined')
					activateByLook = scope.activeProject.hotspotProfileStandard.activateByLook;
				else
					activateByLook = true;
			}

			if (activateByLook == true)
			{
				if (typeof hotspots === 'undefined')
				{
					return;
				}

				if (typeof activeScene.hotspots !== 'undefined')
				{
					activeScene.hotspots.forEach(function(hotspot)
					{
						// If the hotspot has a radius of -1 and duration of -1, that means it can only
						// be activated by a screen press. Ignore these hotspots.
						if (parseInt(hotspot.radius, 10) == -1 && parseInt(hotspot.duration, 10) == -1)
						{
							return false;
						}

						// If the hotspot event is in the active event queue, don't try to check for it.
						// TODO: It might be faster to keep a separate array of just event ids.
						var eventIsInActiveQueue = false;
						for (var i = 0; i < activeEvents.length; i++)
						{
							if (activeEvents[i].id == hotspot.id)
							{
								eventIsInActiveQueue = true;
							}
						}
	
						if (eventIsInActiveQueue == true)
						{
							return true;
						}
	
						// Hotspots are actual coordinates instead of camera orientation vectors like they were before.
						// We use the raycaster from the camera to determine whether we're over a hotspot.
						// TODO: We'll want to eventually include a way to use the raycaster to intercept hotspots
						// themselves as real objects. This way, when we create 3d scense, any object can become
						// a hotspot. For now, though, we'll just go off the coordinates specified.
						var x, y, z;
						if (cameraSphereIntersection)
						{
							x = cameraSphereIntersection.x;
							y = cameraSphereIntersection.y;
							z = cameraSphereIntersection.z;
						}
						else
						{
							return;
						}
	
						// TODO: Don't re-activate a hotspot if we've just barely finished activating it and are still
						// within the radius.
						if (lastHotspot && lastHotspot.id == hotspot.id)
						{
							return;
						}
	
						// Check for conditions before enabling the hotspot.
						var conditionFlag = true;
						if (typeof hotspot.conditions !== 'undefined' && hotspot.conditions.length > 0)
						{
							var cond = hotspot.conditions;
							for (var c = 0; c < cond.length; c++)
							{ 
								if (cond[c].type == 'variable')
								{
									var varIndex = variablesIndexes.indexOf(cond[c].variableName);
									if (varIndex != -1)
									{
										// Test for the opposite of the operator so we know if we need to set conditionFlag to false.
										// TODO: Take strings and numbers into account so we don't run into errors.
										if (cond[c].variableOperator == '=')
										{
											if (variables[varIndex].value != cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '!=')
										{
											
											if (variables[varIndex].value == cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '>')
										{
											if (variables[varIndex].value <= cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
										else if (cond[c].variableOperator == '<')
										{
											if (variables[varIndex].value >= cond[c].variableOperand)
											{
												conditionFlag = false;
											}
										}
									}
								}
							}
						}

						// When a hotspot countdown is activated, all we're doing is initiating a spritemap that
						// acts independently of our count of the hotspot duration here, though they should act in
						// sync anyway, if the hotspot duration and the spritemap duration are the same.

						// Only focus on the active hotspot if activeHotspot is set.
						if (scope.activeHotspot)
						{
							var diffX = Math.abs(x - scope.activeHotspot.positionX);
							var diffY = Math.abs(y - scope.activeHotspot.positionY);
							var diffZ = Math.abs(z - scope.activeHotspot.positionZ);
							var diffTotal = diffX + diffY + diffZ;
	
							// If the camera has moved away from the hotspot, disable activeHotspot.
							if (diffTotal > scope.activeHotspot.radius)
							{
								// Remove the spritemap from the active spritemap queue.
								if (typeof scope.activeHotspot.countdownSpritemap !== undefined)
								{
									for (var s = 0; s < activeScene.spritemaps.length; s++)
									{
										if (activeScene.spritemaps[s].id == scope.activeHotspot.countdownSpritemap.id)
										{
											activeScene.spritemaps[s].complete = true;
										}
									}
								}
	
								scope.activeHotspot = null;
								scope.percentComplete = 0;
	//							countdownCanvas.style.display = 'none';
							}
							else
							{
								if (conditionFlag == false)
								{
//									alert('false');
									return;
								}
	
								// Detect how long the hotspot has been triggered. If it reaches the hotspot's
								// duration, start executing the actions.
								var timeElapsed = clock.getElapsedTime() - scope.activeHotspot.startTime;
								var percentComplete = timeElapsed / (scope.activeHotspot.duration / 1000)
								scope.percentComplete = percentComplete;
	
								// If we've reached 100%, execute the action.
								if (percentComplete >= 1)
								{
									// Track this as the last hotspot so it's not immediately reactivated.
									lastHotspot = hotspot;
	
									// Remove the spritemap from the active spritemap queue.
//									scope.drawCountdown(0, scope.activeHotspot);
									if (typeof scope.activeHotspot.countdownSpritemap !== undefined)
									{
										for (var s = 0; s < activeScene.spritemaps.length; s++)
										{
											if (activeScene.spritemaps[s].id == scope.activeHotspot.countdownSpritemap.id)
											{
												activeScene.spritemaps[s].complete = true;
											}
										}
									}
	
									scope.percentComplete = 0;

									// If the hotspot has "blockHotspots" set to true, set the viewer's "blockHotspots" to true now.
									if (typeof scope.activeHotspot.blockHotspots !== 'undefined')
									{
										if (scope.activeHotspot.blockHotspots == true)
											blockHotspots = true;
										else
											blockHotspots = false;
									}
	
									// Add the actions to the queue.
									activeEvents.push(scope.activeHotspot);
									scope.activeHotspot = null;

								}
								else
								{
									// Do nothing. Just continue on.
//									scope.drawCountdown(percentComplete, scope.activeHotspot);
								}
							}
						}
	
						// There isn't currently an active hotspot, but check if we're in the range of this hotspot,
						// unless there's conditions that aren't being met.
						else
						{
							if (conditionFlag == false)
							{
								// return;
							}
							else
							{
								var diffX = Math.abs(x - hotspot.positionX);
								var diffY = Math.abs(y - hotspot.positionY);
								var diffZ = Math.abs(z - hotspot.positionZ);
								var diffTotal = diffX + diffY + diffZ;
		
								if (diffTotal <= hotspot.radius)
								{
									scope.activeHotspot = hotspot;
			
									// We're entering a new hotspot, so initialize the spritemap and start the clock.
									// When we add a spritemap to the queue in activeScene, we don't need to do anything.
									// The queue itself checks that all the spritemap elements needed for rendering have
									// been created, sets its own clock, and updates accordingly.
									if (typeof scope.activeHotspot.countdownSpritemap !== 'undefined')
									{
										// We're setting the startTime here instead of repeatedly checking if it's been set
										// in update(), since this will save us some processing time.
										// Don't set the startTime in the scope.activeHotspot.countdownSpritemap object.
										// This could have some unexpected results.
										var countdownSpritemap = scope.activeHotspot.countdownSpritemap;
										countdownSpritemap.startTime = clock.getElapsedTime();
		
										// If spritemap XYZ coordinates aren't specified, use the hotspot's coordinates.
										if (typeof countdownSpritemap.positionX === 'undefined' || typeof countdownSpritemap.positionY === 'undefined' || typeof countdownSpritemap.positionZ === 'undefined')
										{
											countdownSpritemap.positionX = hotspot.positionX;
											countdownSpritemap.positionY = hotspot.positionY;
											countdownSpritemap.positionZ = hotspot.positionZ;
										}

										countdownSpritemap.alignWithCamera = true;	// This 
										var spritemapAnimation = scope.createSpritemapAnimator(countdownSpritemap);
										if (spritemapAnimation)
										{
											activeScene.spritemaps.push(spritemapAnimation);
										}
									}
//									scope.drawCountdown(0, scope.activeHotspot);
//									countdownCanvas.style.display = 'block';
									scope.activeHotspot = JSON.parse(JSON.stringify(hotspot));
									scope.activeHotspot.startTime = clock.getElapsedTime();
								}
								else
								{
									// Deactivate the countdown and last hotspot.
									// Remove the spritemap from the active spritemap queue.
//									scope.drawCountdown(0, scope.activeHotspot);
									if (scope.activeHotspot && typeof scope.activeHotspot.countdownSpritemap !== undefined)
									{
										for (var s = 0; s < activeScene.spritemaps.length; s++)
										{
											if (activeScene.spritemaps[s].id == scope.activeHotspot.countdownSpritemap.id)
											{
												activeScene.spritemaps[s].complete = true;
											}
										}
									}
		
//									countdownCanvas.style.display = 'none';
									scope.activeHotspot = null;
									lastHotspot = null;
								}
							}
						}
					});
				}
			}
		  }

		  setTimeout(function()
		  {
			currentAnimationFrameId = window.requestAnimationFrame(scope.scanHotspots);
		  }, 1);
		}



		// We don't actually get rid of the stereoEffect (not sure it can be done), but we just
		// render the view differently in render(). We have to make sure to reset the renderer
		// size when we toggle back to standard mode, since StereoEffect changes that.
		scope.toggleMode = function()
		{
			if (scope.vrMode == true)
			{
				if (typeof stereoEffect === 'undefined')
				{
					// Stereoscopic effect
					stereoEffect = new THREE.StereoEffect(renderer);
					stereoEffect.separation = -6.2;
					stereoEffect.setSize(contW, contH);
				}
				camera.fov = 90;
				camera.updateProjectionMatrix();
//				cameraOrtho.updateProjectionMatrix();

				// Active the DeviceOrientation controls.
				window.addEventListener('deviceorientation', scope.setOrientationControls, true);
//				window.addEventListener('deviceorientation', scope.getCompassOrientation, true);
			}
			else
			{
				renderer.setSize(contW, contH);
				camera.fov = 70;
				camera.updateProjectionMatrix();
//				cameraOrtho.updateProjectionMatrix();

				// Deactivate the DeviceOrientation controls.
				if (typeof deviceOrientationControls !== 'undefined' && deviceOrientationControls)
					deviceOrientationControls.enabled = false;
				orbitControls.enabled = true;
//				controls.disconnect();

//				controls = new THREE.OrbitControls(camera, domElement);
/*
				controls.target.set(
					camera.position.x + 0.1,
					camera.position.y,
					camera.position.z
				);
*/
//				controls.connect();
				orbitControls.update();

//				window.removeEventListener('deviceorientation', scope.setOrientationControls, true);
			}
		}



		scope.getCompassOrientation = function(e)
		{
			if (!e.alpha)
				return;
			orientationAlpha = e.alpha.toFixed(2);
			orientationBeta = e.beta.toFixed(2);
			orientationGamma = e.gamma.toFixed(2);
//			orientationAbs = e.absolute;
//			alert(orientationAlpha);

			// Landscape
			if (orientationBeta)
			{
				if (orientationAlpha < 45 || orientationAlpha > 315)
				{
					orientationCompass = 'east';
				}
				else if (orientationAlpha >= 225 && orientationAlpha < 315)
				{
					orientationCompass = 'south';
				}
				else if (orientationAlpha >= 135 && orientationAlpha < 225)
				{
					orientationCompass = 'west';
				}
				else
				{
					orientationCompass = 'north';
				}
			}
		}



		scope.setOrientationControls = function(e)
		{
			if (!e.alpha) 
			{
				return;
			}

			if (typeof deviceOrientationControls === 'undefined' || !deviceOrientationControls)
			{
				deviceOrientationControls = new THREE.DeviceOrientationControls(camera);
				deviceOrientationControls.connect(clock.getDelta());
//				deviceOrientationControls.update(clock.getDelta());
			}
//			deviceOrientationControls.enabled = true;

			if (typeof deviceOrientationControls !== 'undefined' && deviceOrientationControls)
			{
				// Active the DeviceOrientationControls and deactivate the OrbitControls.
				deviceOrientationControls.enabled = true;
				orbitControls.enabled = false;
			}
			else
			{
				// Keep the OrbitControls activated.
				orbitControls.enabled = true;
			}

			// Remove the listener, since we've already set up the controls and don't need it anymore.
			window.removeEventListener('deviceorientation', scope.setOrientationControls, true);
		}

		// -----------------------------------
		// Updates
		// -----------------------------------
		scope.resizeCanvas = function()
		{
			contW = element[0].clientWidth;
			contH = element[0].clientHeight;
//			contW = scope.windowWidth;
//			contH = scope.windowHeight;

			windowHalfX = contW / 2;
			windowHalfY = contH / 2;

			camera.aspect = contW / contH;
			camera.updateProjectionMatrix();
//			cameraOrtho.updateProjectionMatrix();
/*
            element[0].clientWidth : scope.width;
			alert(contW + ' ' + contH);
	        var width = contW;
	        var height = contH;
	
	        camera.aspect = width / height;
	        camera.updateProjectionMatrix();
	
	        renderer.setSize(width, height);
*/
	        if (scope.vrMode == true)
	        {
		        stereoEffect.setSize(contW, contH);
	        }
	        else
	        {
				renderer.setSize(contW, contH);
	        }
		};

        // -----------------------------------
        // Draw and Animate
        // -----------------------------------
        scope.crosshairs = function()
        {
			var crosshairTexture = THREE.ImageUtils.loadTexture('assets/images/crosshairs04.png');
			crosshairTexture.minFilter = THREE.LinearFilter;
			var crosshairMaterial = new THREE.SpriteMaterial( { map: crosshairTexture, depthTest: false } );
			var crosshairSprite = new THREE.Sprite(crosshairMaterial);
			//scale the crosshairSprite down in size
			crosshairSprite.scale.set(15, 15, 1.0);
			//add crosshairSprite as a child of our camera object, so it will stay centered in camera's view
			camera.add(crosshairSprite);
			//position sprites by percent X:(100 is all the way to the right, 0 is left, 50 is centered)
			//                            Y:(100 is all the way to the top, 0 is bottom, 50 is centered)
//			var crosshairPercentX = 50;
//			var crosshairPercentY = 50;
//			var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
//			var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;
			crosshairSprite.position.x = 0;
			crosshairSprite.position.y = 0;
			crosshairSprite.position.z = -100;
//			crosshairSprite.position.set(x, y, z);
        }

		scope.drawCameraOrientation = function()
		{
			if (!cameraOrientationCanvas)
			{
				cameraOrientationCanvas = document.createElement('canvas');
				cameraOrientationCanvas.id = 'cameraOrientation';
				cameraOrientationCanvas.width = 640;
				cameraOrientationCanvas.height = 25;
				element[0].appendChild(cameraOrientationCanvas);
			}

			// Get the camera orientation.
			var pLocal = new THREE.Vector3(0, 0, -1);
			var pWorld = pLocal.applyMatrix4(camera.matrixWorld);
			var dir = pWorld.sub(camera.position).normalize();
			dir = pWorld;
//			var x = Math.round(dir.x * 100000) / 100000;
//			var y = Math.round(dir.y * 100000) / 100000;
//			var z = Math.round(dir.z * 100000) / 100000;
			orientationX = dir.x.toFixed(3);
			orientationY = dir.y.toFixed(3);
			orientationZ = dir.z.toFixed(3);
			orientationAlpha = Math.round(orientationAlpha * 100000) / 100000;
			orientationBeta = Math.round(orientationBeta * 100000) / 100000;
			orientationGamma = Math.round(orientationGamma * 100000) / 100000;
//			orientationAlpha = THREE.Math.degToRad(orientationAlpha).toFixed(3);
//			orientationBeta = THREE.Math.degToRad(orientationBeta).toFixed(3);
//			orientationGamma = THREE.Math.degToRad(orientationGamma).toFixed(3);

//			orientationX = camera.rotation.x.toFixed(3);
//			orientationY = camera.rotation.y.toFixed(3);
//			orientationZ = camera.rotation.z.toFixed(3);
			orientationX = THREE.Math.radToDeg(camera.rotation.x).toFixed(3);
			orientationY = THREE.Math.radToDeg(camera.rotation.y).toFixed(3);
			orientationZ = THREE.Math.radToDeg(camera.rotation.z).toFixed(3);

			var text = 'X: ' + orientationX + '   Y: ' + orientationY + '   Z: ' + orientationZ + '| A: ' + orientationAlpha  + '  B: ' + orientationBeta + '  C: ' + orientationGamma;
//			text += '  Dir: ' + orientationCompass;
			if (typeof activeScene.northRotationOffset !== 'undefined')
			{
				text += ' Off: ' + activeScene.northRotationOffset;
			}

			// Draw the coordinates.
			var ctx = cameraOrientationCanvas.getContext('2d');
			ctx.clearRect(0, 0, cameraOrientationCanvas.width, cameraOrientationCanvas.height);
			ctx.rect(0, 0, cameraOrientationCanvas.width, cameraOrientationCanvas.height);
			ctx.font = '16px Open Sans';
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 3;
			ctx.strokeText(text, 20, 20);
			ctx.fillStyle = 'white';
			ctx.fillText(text, 20, 20);

			setTimeout(function()
			{
				currentAnimationFrameId = window.requestAnimationFrame(scope.drawCameraOrientation);
			}, 1);
		}

		// For example of how to detect a "touch" of an object in a scene (for desktop users), see http://stackoverflow.com/questions/25024044/three-js-raycasting-with-camera-as-origin
		// See http://jsfiddle.net/KYnyC/116/
		scope.drawRaycasterOrientation = function()
		{
			if (!raycasterOrientationCanvas)
			{
				raycasterOrientationCanvas = document.createElement('canvas');
				raycasterOrientationCanvas.id = 'raycasterOrientation',
				raycasterOrientationCanvas.width = 640;
				raycasterOrientationCanvas.height = 25;
				element[0].appendChild(raycasterOrientationCanvas);
			}

			// Get the raycaster orientation.
			if (typeof activeScene !== 'undefined' && activeScene.hasOwnProperty('background'))
			{
				var backgroundObject = scene.getObjectByName('sceneBackground');
				var directionVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
				var raycaster = new THREE.Raycaster(camera.position, directionVector.normalize());
				var intersection = raycaster.intersectObject(backgroundObject, true);
/*
				if (clock.getElapsedTime() >= rayTime + 3)
				{
					rayTime = clock.getElapsedTime();
				}
*/
				if (typeof intersection[0] !== 'undefined')
				{
					var x = intersection[0].point.x.toFixed(3);
					var y = intersection[0].point.y.toFixed(3);
					var z = intersection[0].point.z.toFixed(3);
					var distance = intersection[0].distance.toFixed(3);

					cameraSphereIntersection = { x: x, y: y, z: z };

					var text = 'X: ' + x + '   Y: ' + y + '   Z: ' + z + '   Dist: ' + distance;

					// Draw the coordinates.
					var ctx = raycasterOrientationCanvas.getContext('2d');
					ctx.clearRect(0, 0, raycasterOrientationCanvas.width, raycasterOrientationCanvas.height);
					ctx.rect(0, 0, raycasterOrientationCanvas.width, raycasterOrientationCanvas.height);
					ctx.font = '16px Open Sans';
					ctx.strokeStyle = 'black';
					ctx.lineWidth = 3;
					ctx.strokeText(text, 20, 20);
					ctx.fillStyle = 'white';
					ctx.fillText(text, 20, 20);
				}
			}

			setTimeout(function()
			{
				currentAnimationFrameId = window.requestAnimationFrame(scope.drawRaycasterOrientation);
			}, 1);
		}

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
//			if (typeof activeScene === 'undefined')
			
			// Rotate the camera proportionately to the "north" indicated for the scene.
//			if (typeof activeScene.northX !== 'undefined' && typeof activeScene.northY !== 'undefined' && typeof activeScene.northZ !== 'undefined')
//			{
//				console.log(camera.rotation.y * (180 / Math.PI) + 180);
//				camera.rotation.y = camera.rotation.y + 0.05;
//			}

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
			var removeSpritemapIndexes = [];

			// Create and update any spritemaps as necessary.
			if (typeof activeScene.spritemaps !== 'undefined' && activeScene.spritemaps != null)
			{
				for (var s = 0; s < activeScene.spritemaps.length; s++)
				{
					// If the spritemap has been flagged as "complete" then add it to the removal queue.
					if (typeof activeScene.spritemaps[s].complete !== 'undefined')
					{
						if (activeScene.spritemaps[s].complete == true)
						{
							removeSpritemapIndexes.push(activeScene.spritemaps[s].id);
						}
					}

					// Update the texture.
					else
					{
						activeScene.spritemaps[s].update();
					}
				}
			}

			for (var r = 0; r < removeSpritemapIndexes.length; r++)
			{
				if (typeof activeScene.spritemaps[r] !== 'undefined')
					activeScene.spritemaps[r].remove();
				activeScene.spritemaps.splice(removeSpritemapIndexes[r], 1);
			}


			// Process all video objects and apply transparency if needed.
			if (typeof activeScene.videoSprites !== 'undefined' && activeScene.videoSprites != null)
			{
				for (var v = 0; v < activeScene.videoSprites.length; v++)
				{
					// If the video has finished playing or has been flagged as "complete" then add it to the removal queue.
					if (typeof activeScene.videoSprites[v].complete !== 'undefined')
					{
						if (activeScene.videoSprites[v].complete == true)
						{
						}
					}
	
					// Render the image and update the count. The texture is being updated in scope.render().
					else
					{
						activeScene.videoSprites[v].render();
						activeScene.videoSprites[v].update();
					}
				}
			}
		}

		scope.isFullScreen = function() {
			var fsElem =
				document.fullscreenElement ||
				document.msFullscreenElement ||
				document.mozFullscreenElement ||
				document.webkitFullscreenElement;
			return ((fsElem != null) && (fsElem != undefined));
		}

		scope.fullscreen = function() {
			if (element[0].requestFullscreen) {
				element[0].requestFullscreen();
			} else if (element[0].msRequestFullscreen) {
				element[0].msRequestFullscreen();
			} else if (element[0].mozRequestFullScreen) {
				element[0].mozRequestFullScreen();
			} else if (element[0].webkitRequestFullscreen) {
				element[0].webkitRequestFullscreen();
			}
			scope.resizeCanvas();
		}

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
		}

		// Create a chroma key video material.
		scope.VideoChromaKeyMaterial = function(url, width, height, keyColor)
		{
			THREE.ShaderMaterial.call(this);
		}

		// Create a video object.
		// videoData: videoTransparencyColorRGB, videoHeight, videoWidth, videoScaleX, videoScaleY, videoVolume,
		//		videoInTransition, videoInTransitionDuration, videoOutTransition, videoOutTransitionDuration
		// For most videos we can just play the video element directly as the texture, which makes it simple.
		// However, if there's a greenscreen alpha setting, we'll need to paint to a canvas first. This should all be
		// stored and handled within the video object, though, so the object has its own play() and stop() functions.
		scope.createVideoObject = function(videoData, videoPlayer)
		{
			// Don't continue if the videoPlayer object doesn't exist.
			if (typeof videoPlayer === 'undefined')
				return;

			var fileId;
			var filePath;
			var fileType;
			var fileMimeType;
			var fileHeight;
			var fileWidth;
			var fileScaleX = 1.0;
			var fileScaleY = 1.0;

			var mediaFile = scope.getMediaFile(videoData.media);
			if (mediaFile == null)
				return;

			fileId = mediaFile.id;
			filePath = mediaFile.filepath;
			fileType = 'video';
			fileMimeType = mediaFile.mimetype;
			fileHeight = mediaFile.height;
			fileWidth = mediaFile.width;

			if (!filePath)
				return null;

			videoPlayer.height = fileHeight;
			videoPlayer.width = fileWidth;

			if (typeof videoData.scaleX !== 'undefined')
				fileScaleX = videoData.scaleX;
			if (typeof videoData.scaleY !== 'undefined')
				fileScaleY = videoData.scaleY;
/*
			var videoPlayerElement = document.createElement('video');
			videoPlayerElement.id = 'videoPlayer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			videoPlayerElement.src = '/assets/video/blank.mp4';	// TODO: Add multiple sources?
			videoPlayerElement.autoplay = false;
			videoPlayerElement.loop = false;
			videoPlayerElement.width = 0;
			videoPlayerElement.height = 0;
			element[0].appendChild(videoPlayerElement);
*/
			// Create a video canvas.
//			var videoCanvas = scope.createVideoPlayer();

			// Use the base video player for the content.
			videoPlayer.src = filePath;
			videoPlayer.type = fileMimeType;
			videoPlayer.load();

			var videoCanvas = document.createElement('canvas');
			videoCanvas.id = 'video_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
			videoCanvas.className = 'videoCanvas';
			videoCanvas.height = videoPlayer.height;
			videoCanvas.width = videoPlayer.width;
			element[0].appendChild(videoCanvas);

			videoCanvasContext = videoCanvas.getContext('2d');
			videoCanvasContext.fillstyle = '#000000';
			videoCanvasContext.fillRect(0, 0, videoPlayer.width, videoPlayer.height);

//			videoTexture = new THREE.Texture(videoCanvas);
			videoTexture = new THREE.Texture(videoPlayer);
			videoTexture.minFilter = THREE.LinearFilter;
			videoTexture.magFilter = THREE.LinearFilter;

			var videoMaterial = new THREE.MeshBasicMaterial({
				map: videoTexture,
				overdraw: false,
			});

			// TODO: Do we need to make sure the sphere is only created once when the viewer loads?
			var videoSprite = new THREE.Sprite(videoMaterial);

			var scaleX = 50;
			var scaleY = 50;
			scaleX *= fileScaleX;
			scaleY *= fileScaleY;
			videoSprite.scale.set(scaleX, scaleY, 1.0);
			videoSprite.position.set(videoData.positionX, videoData.positionY, videoData.positionZ);

			scene.add(videoSprite);
			videoPlayer.play();

			var videoObject =
			{
				videoPlayer: videoPlayer,
				fileId: fileId,
				filePath: filePath,
				fileType: fileType,
				fileHeight: fileHeight,
				fileWidth: fileWidth,
				videoTexture: videoTexture,
				videoMaterial: videoMaterial,
				sprite: videoSprite,
				height: videoData.height,
				width: videoData.width,
				length: videoData.length,
				duration: videoData.duration,
				repeat: videoData.repeat,

				// Change the transparency RGB colors from the default as needed, or just have them all load in the JSON instead of the 0x transparencyColor.
//				transparencyColor: videoData.transparencyColor,
				transparencyColor: '',
				transparencyColorR: 25,
				transparencyColorG: 90,
				transparencyColorB: 60,

				inTransition: videoData.inTransition,
				inTransitionDuration: videoData.inTransitionDuration,
				outTransition: videoData.outTransition,
				outTransitionDuration: videoData.outTransitionDuration,
				scaleX: videoData.scaleX,
				scaleY: videoData.scaleY,
				startDisplayTime: clock.getElapsedTime(),			// The time the video started playing.
				counterDisplayTime: 0,								// How long in seconds since we started the animation.
				currentDisplayTime: clock.getElapsedTime(),			// The current time of the animation.

				update: function()
				{
					var elapsedTime = clock.getElapsedTime();
					this.counterDisplayTime += (elapsedTime - this.currentDisplayTime);
					this.currentDisplayTime = elapsedTime;
				},

				render: function()
				{
					// If we have a transparency color, we need to use a buffer canvas.
					// See https://developer.mozilla.org/samples/video/chroma-key/index.xhtml
					if (this.transparencyColor !== 'undefined' && this.transparencyColor && this.transparencyColor != '')
					{
						if (typeof this.bufferCanvas === 'undefined')
						{
							var bufferCanvas = document.createElement('canvas');
							bufferCanvas.id = 'videoBuffer_' + Date.now() + Math.floor(1000000 + Math.random() * 9000000);
							bufferCanvas.className = 'bufferCanvas';
							bufferCanvas.height = this.fileHeight;
							bufferCanvas.width = this.fileWidth;
							element[0].appendChild(bufferCanvas);
							this.bufferCanvas = bufferCanvas;
							this.bufferCanvasContext = bufferCanvas.getContext('2d');
						}

						if (this.videoPlayer.readyState === videoPlayer.HAVE_ENOUGH_DATA)
						{
							if (typeof videoCanvasContext !== 'undefined')
							{
								var imgBackgroundData = videoCanvasContext.getImageData(0, 0, this.fileWidth, this.fileHeight);

								var bufferCanvasContext = this.bufferCanvas.getContext('2d');
								bufferCanvasContext.drawImage(this.videoPlayer, 0, 0);
								var imgDataNormal = bufferCanvasContext.getImageData(0, 0, this.fileWidth, this.fileHeight);
								var imgData = bufferCanvasContext.createImageData(this.fileWidth, this.fileHeight);

								for (var i = 0; i < imgData.width * imgData.height * 4; i += 4)
								{
									var r = imgDataNormal.data[i + 0];
									var g = imgDataNormal.data[i + 1];
									var b = imgDataNormal.data[i + 2];
									var a = imgDataNormal.data[i + 3];

									// Compare RGB levels for the transparency color and set alpha channel to 0.
									if (r <= this.transparencyColorR && b <= this.transparencyColorB && g >= this.transparencyColorG)
										a = 0;

									if (a != 0)
									{
										imgData.data[i + 0] = r;
										imgData.data[i + 1] = g;
										imgData.data[i + 2] = b;
										imgData.data[i + 3] = a;
									}
								}

								for (var y = 0; y < imgData.height; y++) {
								    for (var x = 0; x < imgData.width; x++) {
								        var r = imgData.data[((imgData.width * y) + x) * 4];
								        var g = imgData.data[((imgData.width * y) + x) * 4 + 1];
								        var b = imgData.data[((imgData.width * y) + x) * 4 + 2];
								        var a = imgData.data[((imgData.width * y) + x) * 4 + 3];
								        if (imgData.data[((imgData.width * y) + x) * 4 + 3] != 0) {
								            var offsetYup = y - 1;
								            var offsetYdown = y + 1;
								            var offsetXleft = x - 1;
								            var offsetxRight = x + 1;
								            var change=false;
								            if(offsetYup>0)
								            {
								                if(imgData.data[((imgData.width * (y-1) ) + (x)) * 4 + 3]==0)
								                {
								                    change=true;
								                }
								            }
								            if (offsetYdown < imgData.height)
								            {
								                if (imgData.data[((imgData.width * (y + 1)) + (x)) * 4 + 3] == 0) {
								                    change = true;
								                }
								            }
								            if (offsetXleft > -1) {
								                if (imgData.data[((imgData.width * y) + (x -1)) * 4 + 3] == 0) {
								                    change = true;
								                }
								            }
								            if (offsetxRight < imgData.width) {
								                if (imgData.data[((imgData.width * y) + (x + 1)) * 4 + 3] == 0) {
								                    change = true;
								                }
								            }
								            if (change) {
								                var gray = (imgData.data[((imgData.width * y) + x) * 4 + 0] * .393) + (imgData.data[((imgData.width * y) + x) * 4 + 1] * .769) + (imgData.data[((imgData.width * y) + x) * 4 + 2] * .189);                                
								                imgData.data[((imgData.width * y) + x) * 4] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4] *0.9);
								                imgData.data[((imgData.width * y) + x) * 4 + 1] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4 + 1]*0.9);
								                imgData.data[((imgData.width * y) + x) * 4 + 2] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4 + 2] * 0.9);
								                imgData.data[((imgData.width * y) + x) * 4 + 3] = 255;
								            }
								        }
								        
								    }
								}

				                for (i = 0; i < imgData.width * imgData.height * 4; i += 4) {
				                    var r = imgData.data[i + 0];
				                    var g = imgData.data[i + 1];
				                    var b = imgData.data[i + 2];
				                    var a = imgData.data[i + 3];                
				                    if (a == 0) {
				                            imgData.data[i + 0] = imgBackgroundData.data[i + 0];
				                            imgData.data[i + 1] = imgBackgroundData.data[i + 1];
				                            imgData.data[i + 2] = imgBackgroundData.data[i + 2];
				                            imgData.data[i + 3] = imgBackgroundData.data[i + 3];
				                    }                   
				                }

								videoCanvasContext.putImageData(imgData, 0, 0);

//								videoCanvasContext.drawImage(this.bufferCanvas, 0, 0);
								if (typeof videoTexture !== 'undefined' && videoTexture)
								{
									videoTexture.needsUpdate = true;
								}
							}
						}
					}
					else
					{
						if (this.videoPlayer.readyState === videoPlayer.HAVE_ENOUGH_DATA)
						{
							if (typeof videoCanvasContext !== 'undefined')
							{
								videoCanvasContext.drawImage(this.videoPlayer, 0, 0);
	
								if (typeof videoTexture !== 'undefined' && videoTexture)
								{
									videoTexture.needsUpdate = true;
								}
							}
						}
					}
				},

				remove: function()
				{
				}
			}
			return videoObject;
		}

		// Create a spritemap animator object.
		scope.createSpritemapAnimator = function(spritemapData)
		{
			var fileId;
			var filePath;
			var fileType;
			var fileHeight;
			var fileWidth;
			var fileScaleX = 1.0;
			var fileScaleY = 1.0;

			// TODO: Use a media handler to load the correct texture file.
/*
			var fileId = spritemapData.media.fileIdHigh;

			for (var f = 0; f < spritemapData.media.files.length; f++)
			{
				if (spritemapData.media.files[f].fileId == fileId)
				{
					filePath = spritemapData.media.files[f].filePath;
					fileType = spritemapData.media.files[f].fileType;
					fileHeight = spritemapData.media.files[f].fileHeight;
					fileWidth = spritemapData.media.files[f].fileWidth;
					break;
				}
			}
*/
			var mediaFile = scope.getMediaFile(spritemapData.media);
			if (mediaFile == null)
				return;

			fileId = mediaFile.id;
			filePath = mediaFile.filepath;
			fileType = 'spritemap';
			fileHeight = mediaFile.height;
			fileWidth = mediaFile.width;

			if (!filePath)
				return null;

			if (typeof spritemapData.media.scaleX !== 'undefined')
				fileScaleX = spritemapData.media.scaleX;
			if (typeof spritemapData.media.scaleY !== 'undefined')
				fileScaleY = spritemapData.media.scaleY;

			var spriteTexture;
			var spriteMaterial;
			var spriteGeometry;
			var sprite;
			var scaleX;
			var scaleY;

			spriteTexture = new THREE.ImageUtils.loadTexture(filePath);
			spriteTexture.minFilter = THREE.LinearFilter;
//			spriteTexture.wrapS = spriteTexture.wrapT = THREE.RepeatWrapping;
			spriteTexture.wrapS = spriteTexture.wrapT = THREE.ClampToEdgeWrapping;
			spriteTexture.repeat.set(1 / spritemapData.spritemapTilesHorizontal, 1 / spritemapData.spritemapTilesVertical);
/*
			spriteMaterial = new THREE.SpriteMaterial({
				map: spriteTexture,
				transparent: true,
			});

			// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
			// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
			spriteMaterial.depthWrite = false;
			spriteMaterial.depthTest = false;

			sprite = new THREE.Sprite(spriteMaterial);
*/
			var spriteType = 'mesh';	// THREE.Mesh

			if (typeof spritemapData.alignWithCamera !== 'undefined')
			{
				if (spritemapData.alignWithCamera == true)
				{
					spriteType = 'mesh';	// THREE.Sprite
				}
			}

			if (spriteType == 'sprite')
			{
				var imageTexture = THREE.ImageUtils.loadTexture(filePath);
				imageTexture.minFilter = THREE.LinearFilter;
				imageTexture.needsUpdate = true;

				var imageSpriteMaterial = new THREE.SpriteMaterial({
					map: imageTexture,
					transparent: true,
				});

				// Changing depthWrite to false ensures the material is on top, and doesn't intersect with the sphere.
				// See http://stackoverflow.com/questions/16247280/force-a-sprite-object-to-always-be-in-front-of-skydome-object-in-three-js
				imageSpriteMaterial.depthWrite = false;
				imageSpriteMaterial.depthTest = false;

				imageSpriteMaterial.opacity = 0.85;

				sprite = new THREE.Sprite(imageSpriteMaterial);

				var scaleX = 50;
				var scaleY = 50;

				sprite.scale.set(scaleX, scaleY, 1.0);
				sprite.position.set(spritemapData.positionX, spritemapData.positionY, spritemapData.positionZ, 1.0);
				sprite.matrixWorldNeedsUpdate = true;
				scene.add(sprite);
			}
			else if (spriteType == 'mesh')
			{
				spriteMaterial = new THREE.MeshBasicMaterial({
					map: spriteTexture,
					transparent: true,
				});
				spriteMaterial.depthWrite = false;
				spriteMaterial.depthTest = false;

				// TODO: Retrieve the width and height of the image. First try to get it from the JSON data. If it's not there,
				// retrieve it via Javascript.
				spriteGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
				sprite = new THREE.Mesh(spriteGeometry, spriteMaterial);

				scaleX = 50;
				scaleY = 50;
				scaleX *= fileScaleX;
				scaleY *= fileScaleY;
				sprite.scale.set(scaleX, scaleY, 1.0);
				sprite.position.set(spritemapData.positionX, spritemapData.positionY, spritemapData.positionZ);
				sprite.lookAt(camera.position);
				sprite.matrixWorldNeedsUpdate = true;
			}

			scene.add(sprite);

			var spritemapAnimator =
			{
				positionX: spritemapData.positionX,
				positionY: spritemapData.positionY,
				positionZ: spritemapData.positionZ,
				fileId: fileId,
				filePath: filePath,
				fileType: fileType,
				fileHeight: fileHeight,
				fileWidth: fileWidth,
				scaleX: fileScaleX,
				scaleY: fileScaleY,
				translateScaleDiffX: null,
				translateScaleDiffY: null,
				translateScaleMultiplierX: null,
				translateScaleMultiplierY: null,
				currentScaleX: fileScaleX,
				currentScaleY: fileScaleY,
				spriteTexture: spriteTexture,
				spriteMaterial: spriteMaterial,
				spriteGeometry: spriteGeometry,
				sprite: sprite,
				spritemapHeight: spritemapData.spritemapHeight,
				spritemapWidth: spritemapData.spritemapWidth,
				spritemapDuration: spritemapData.spritemapDuration,
				spritemapRepeat: spritemapData.spritemapRepeat,
				spritemapTileSequence: spritemapData.spritemapTileSequence,
				tilesHoriz: spritemapData.spritemapTilesHorizontal,
				tilesVert: spritemapData.spritemapTilesVertical,
				tilesNum: spritemapData.spritemapTilesNum,		// The total number of tiles in the spritemap.
				tileDuration: (spritemapData.spritemapDuration / spritemapData.spritemapTileSequence.length) / 1000,	// How long in seconds each tile should be displayed.
				startDisplayTime: clock.getElapsedTime(),			// The time the spritemap started animating.
				counterDisplayTime: 0,							// How long in seconds since we started the animation.
				currentDisplayTime: clock.getElapsedTime(),		// The current time of the spritemap's animation.
				currentTile: spritemapData.spritemapTileSequence[0],		// The tile currently being displayed. Should be the first one in the sequence.
				currentTileIndex: 0,							// The index of spritemapTileSequence.

				update: function()
				{
					this.sprite.lookAt(camera.position);
					this.sprite.rotation.z = -camera.rotation.y;
					this.sprite.rotation.z = -orbitControls.object.rotation.y;

					var elapsedTime = clock.getElapsedTime();
					this.counterDisplayTime += (elapsedTime - this.currentDisplayTime);
					this.currentDisplayTime = elapsedTime;

					// If we reach the spritemap duration, cue the animation to stop, unless this is a repeating
					// animation, in which case we reset the tile index and start display time.
					if (this.spritemapRepeat == true)
					{
						if (this.currentTileIndex >= (this.spritemapTileSequence.length - 1))
						{
							this.currentTileIndex = 0;
						}
					}
					else
					{
						if (elapsedTime >= this.startDisplayTime + (this.spritemapDuration / 1000))
						{
							this.complete = true;
						}

						// If we reach the last tile in the sequence, stop on it.
						if (this.currentTileIndex >= (this.spritemapTileSequence.length - 1))
						{
							this.currentTileIndex = this.spritemapTileSequence.length - 1;
//							console.log(this.spritemapWidth + ' ' + this.currentTileIndex);
						}
					}

					// Think of each interval as a "checkpoint."
					// If (currentTileIndex + 1) * (tileDuration / 1000) > elapsedTime, we can increment the currentTileIndex.
//					if (((this.currentTileIndex + 1) * (this.tileDuration / 1000)) > (this.currentDisplayTime - this.startDisplayTime))
					if (this.counterDisplayTime > this.tileDuration)
					{
						this.counterDisplayTime -= this.tileDuration;
						this.currentTileIndex++;

						var currentColumn = this.spritemapTileSequence[this.currentTileIndex] % this.tilesHoriz;
						this.spriteTexture.offset.x = currentColumn / this.tilesHoriz;

						var currentRow = Math.floor(this.spritemapTileSequence[this.currentTileIndex] / this.tilesHoriz) + 1;
						this.spriteTexture.offset.y = 1 - (currentRow / this.tilesVert);
					}

					// If there's a translation occurring, update the position and/or scale now.
					var millisecondsElapsed = 0;
					var percentageComplete = 0;
					if (typeof this.translateDuration === 'undefined')
						this.translateDuration = 0;

					if (typeof this.translateStartTime === 'undefined')
					{
						this.translateStartTime = clock.getElapsedTime();
					}
					else if (this.translateStartTime == null)
					{
						this.translateStartTime = clock.getElapsedTime();
					}
					this.translateCurrentTime = clock.getElapsedTime();
	
					millisecondsElapsed = (this.translateCurrentTime - this.translateStartTime) * 1000;

					if (this.translateDuration == 0)
						percentageComplete = 1.0;
					else
						percentageComplete = millisecondsElapsed / this.translateDuration;

					if (typeof this.translatePath !== 'undefined')
					{
						if (this.translatePath != null)
						{
							// Calculate the current point on the path between 0 and 1 that we should be at, given the translateDuration.
							var currentPointNum = percentageComplete;
							if (currentPointNum > 1.0)
							{
								currentPointNum = 1.0;
							}

							if (percentageComplete > 1.0)
							{
								this.translatePath = null;
							}
							else
							{
								var currentPoint = this.translatePath.getPointAt(currentPointNum);
								this.sprite.position.set(currentPoint.x, currentPoint.y, currentPoint.z);
							}
						}
					}

					// Unlike movement (path) translations, scale translations are always relative to the original scale,
					// which is currently hardcoded above as 50(x) / 50(y). 
					// TODO: Don't hardcode the 50s?
					// Note that with this current implementation, both a translateScaleX and translateScaleY must
					// ALWAYS be specified together, if they're going to be at all. Otherwise, they won't be scaled.
					if (typeof this.translateScaleX !== 'undefined' && typeof this.translateScaleY !== 'undefined')
					{
						if (this.translateScaleX != null && this.translateScaleY != null)
						{
							// Calculate where we should be scaled compared to the source, given the translationDuration.
							var millisecondsElapsed = (this.translateCurrentTime - this.translateStartTime) * 1000;

							if (percentageComplete > 1.0)
							{
								this.translateScaleX = null;
								this.translateScaleY = null;
							}
							else
							{
								// If we don't have scaling iterations for X and Y, create them now. These are used
								// for the duration of this translation, and then cleared out so the spritemap doesn't
								// keep trying to use them.
								if (this.translateScaleDiffX == null)
								{
									this.currentScaleX = this.sprite.scale.x / 50;
//									this.translateScaleDiffX = this.translateScaleX - currentScaleX;
								}

								if (this.translateScaleDiffY == null)
								{
									this.currentScaleY = this.sprite.scale.y / 50;
//									this.translateScaleDiffY = this.translateScaleY - currentScaleY;
								}

//								var currentDiffX = this.translateScaleDiffX * percentageComplete;
//								var currentDiffY = this.translateScaleDiffY * percentageComplete;

								// This is a bit confusing and could be rewritten: scaleX/Y is a hard-coded size for the sprite.
								// this.scaleX/Y is the multiplier (e.g. 1.0);
								var scX = 50;
								var scY = 50;
//								scX *= (parseFloat(this.currentScaleX) + parseFloat(currentDiffX));
//								scY *= (parseFloat(this.currentScaleY) + parseFloat(currentDiffY));
								sprite.scale.set(scX, scY, 1.0);
							}
						}
					}

					if (percentageComplete >= 1.0)
					{
						this.translating = false;
						this.translateStartTime = null;		// Null the start time so it doesn't begin with the last start time for the next translation.
						this.translateScaleDiffX = null;
						this.translateScaleDiffY = null;
					}
				},

				remove: function()
				{
					scene.remove(this.sprite);
					scene.remove(this.spriteGeometry);
					scene.remove(this.spriteMaterial);
					scene.remove(this.spriteTexture);
				}
			}
			return spritemapAnimator;
		}

        // -----------------------------------
        // Watches
        // -----------------------------------
//		scope.$watch('fillcontainer + width + height', function()
//		{
//			scope.resizeCanvas();
//		});

//		scope.$watch('scale', function()
//		{
//			scope.resizeObject();
//		});

//		scope.$watch('activeScene', function()
//		{
//		});

		scope.$watch('vrMode', function()
		{
			scope.toggleMode();
		});

		scope.$watch('goFullscreen', function()
		{
			scope.toggleFullscreen();
		});

		// Start prefetching assets, beginning with the startScene. Note that on mobile browsers,
		// we require a "click" event before this can happen. Only load one scene's assets at a
		// time, then continue to the next scene in activeProject.prefetchAssets.sceneManifest.

		// When prefetching assets, we should only buffer as much audio and video as we need for a playback,
		// then open the scene. The media items can continue buffering as the user navigates the scene. This
		// will speed up load times significantly for scenes with large audio and video files.
		scope.prefetch = function(sceneid)
		{
			if (typeof preloaderManifest === 'undefined')
			{
				return;
			}

			var queue = new createjs.LoadQueue();

			// Find the scene in the manifest.
			for (var i = 0; i < preloaderManifest.length; i++)
			{
				var sceneAssets = preloaderManifest[i];
				if (sceneAssets.sceneid != sceneid)
				{
					continue;
				}
				else
				{
					queue.addEventListener('fileprogress', function(event)
					{
//						(event);
					});

					queue.addEventListener('fileload', function(event)
					{
//						console.log(event);
					});

					queue.addEventListener('complete', function(event)
					{
//						console.log(event);
					});

					// Add the scene assets.
					for (var a = 0; a < sceneAssets.length; a++)
					{
						queue.loadFile(sceneAssets[a].paths);
					}
					queue.load();

					break;
				}
			}
			return;
		}

		// Initialize the viewer.
		scope.init();
		scope.animate();
      }
    };
});
var app = angular
	.module('spherecastApp', ['ui.router', 'satellizer', 'ngAnimate', 'ngFileUpload', 'infinite-scroll'])
	.config(function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider) {

		// Satellizer configuration that specifies which API
		// route the JWT should be retrieved from
		$authProvider.loginUrl = '/api/auth/local';

		$authProvider.google({
//			clientId: '812052042695-v4en26h82f35421l3lnhrfjvu8hrmu54.apps.googleusercontent.com',
			clientId: '',
			url: '/api/auth/google'
		});

		$authProvider.facebook({
//			requiredUrlParams: ['appId'],
//			clientId: '990909701004112',
			clientId: '',
			url: '/api/auth/facebook'
		});

		// Redirect to the upload state if any other states are requested.
		$urlRouterProvider.otherwise('viewer');

		$stateProvider
			.state('auth', {
				url: '/login',
				templateUrl: '../views/authView.html',
				controller: 'AuthController as auth',
			})
			.state('signup', {
				url: '/signup',
				templateUrl: '../views/signupView.html',
				controller: 'AuthController as auth',
			})
			.state('import', {
				url: '/import',
				templateUrl: '../views/importView.html',
				controller: 'ImportController as import',
			})
			.state('logout', {
				url: '/logout',
				controller: function($scope, $rootScope, $auth, $location)
				{
					$auth.removeToken();
					delete $rootScope.authToken;
					localStorage.removeItem('authenticated_user');
					delete $rootScope.authenticatedUser;
					$location.path('/login');
				},
			})
			.state('profile', {
				url: '/profile',
				templateUrl: '../views/profileEditView.html',
				controller: 'ProfileController as profile',
			})
			.state('passwordreset', {
				url: '/passwordreset?token',
				templateUrl: '../views/passwordResetView.html',
				controller: 'AuthController as auth',
			})
			.state('spheres', {
				url: '/spheres',
				templateUrl: '../views/gridView.html',
				controller: 'MediaController as media',
			})
			.state('upload', {
				url: '/upload',
				templateUrl: '../views/uploadView.html',
				controller: 'SingleFileController as file',
			})
			.state('viewer', {
				url: '/{code}',
				templateUrl: '../views/viewerView.html',
				controller: 'ViewerController as viewer',
			});

		$locationProvider.html5Mode(true);
	})
	.run(['$rootScope', '$http', '$location', '$auth', '$state', 'SatellizerConfig', 'AuthenticatedUser', function($rootScope, $http, $location, $auth, $state, SatellizerConfig, AuthenticatedUser)
	{
		$rootScope.$state = $state;
		$rootScope.pageLoaded = true;
		$rootScope.mainMenuCollapsed = true;

		// Log out if token is gone, both on first load and on state changes, and the user is on a login-only state.
		AuthenticatedUser.logoutIfInvalidState($state.current);

		// Retrieve the app ids for social logins and assign them to the Satellizer providers.
		// This is stored in localStorage so we only need to call it once.
		// TODO: Move this into a service, and call from here.
		// TODO: Make this time out every 5 minutes or so, since the authentication ids might change. For
		// the administrator user, make sure the localStorage "site" is cleared out whenever it does
		// change, but for end users, this can change at pre-defined intervals.
		// TODO: Alternatively, we could use a token to make sure we're using the "latest" version of
		// the site data.
		if (localStorage.getItem('site') == null || localStorage.getItem('site') == "")
		{
			$http.get('api/site').success(function(site)
			{
				$rootScope.site = site;
				localStorage.setItem('site', JSON.stringify(site));
				for (var s = 0; s < site.providers.length; s++)
				{
					var provider = site.providers[s];
					SatellizerConfig.providers[provider.auth_provider].clientId = provider.app_id;
				}
			});
		}
		else
		{
			$rootScope.site = JSON.parse(localStorage.getItem('site'));
			for (var s = 0; s < $rootScope.site.providers.length; s++)
			{
				var provider = $rootScope.site.providers[s];
				SatellizerConfig.providers[provider.auth_provider].clientId = provider.app_id;
			}
		}

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams)
		{
			// Log out if user is accessing a state they shouldn't.
			AuthenticatedUser.logoutIfInvalidState(toState);

			// Everything's good. Store the token in the root scope.
			$rootScope.authToken = $auth.getToken();

			// If we don't already have a user object, retrieve the user.
			$rootScope.authenticatedUser = AuthenticatedUser.get();
			if ($rootScope.authenticatedUser)
				$rootScope.displayName = $rootScope.authenticatedUser.name;

			$rootScope.pageLoaded = true;

			// The viewer must have "fullscreenViewer" set to true, so we know to add the "overflow-hidden"
			// class to the body. This is set to "true" in the controller. For everything else, just make
			// sure it's false.'
			if (toState.name != 'viewer')
				$rootScope.fullscreenViewer = false;
		});
	}]);
(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('AuthController', AuthController);

	function AuthController($scope, $rootScope, $http, $auth, $state, $location, AuthenticatedUser) {
/*
		// If the user is already logged in, log out.
		if ($rootScope.authToken || localStorage.getItem('authenticated_user') != null)
		{
			$location.path('/logout');
		}
*/
		var vm = this;

		vm.login = function() {

			var credentials = {
				email: vm.email,
				password: vm.password,
			};

			// Use Satellizer's $auth service to login.
			$auth.login(credentials).then(function(data)
			{
				// Authentication successful, so redirect to /spheres.
				$rootScope.authToken = $auth.getToken();
				AuthenticatedUser.get();
				$state.go('spheres');
			}, function(error)
			{
				vm.error = error;
//				console.log(vm.error);
			});
		}

		$scope.authenticateSocial = function(provider) {
			$auth.authenticate(provider).then(function(data)
			{
				// Authentication successful, so redirect to /spheres.
				$rootScope.authToken = $auth.getToken();
				AuthenticatedUser.get();
				$state.go('spheres');
			}).catch(function(error)
			{
//				console.log(error);
			});
		};

		vm.signup = function()
		{
			$http.post('api/user', { name: vm.name, email: vm.email, password: vm.password, verifypassword: vm.verifypassword }).success(function(user)
			{
				if (user.token)
				{
					var credentials =
					{
						email: vm.email,
						password: vm.password,
					}

					// Use Satellizer's $auth service to login.
					$auth.login(credentials).then(function(data)
					{
						// If login is successful, retrieve the user object, and redirect to the /spheres state.
						AuthenticatedUser.get();
						$state.go('spheres');
					}, function(error)
					{
						vm.error = error;
//						console.log(error);
					});
				}
			}).error(function(error)
			{
				vm.error = error;
//				console.log(error);
			})
		};

		vm.getUser = function()
		{
			$http.get('api/user').success(function(user)
			{
				vm.user = user;
			}).error(function(error)
			{
				vm.error = error;
			});
		}

		vm.resetPassword = function()
		{
			console.log('test');
			$http.post('api/user/resetpassword', { email: vm.email }).success(function(data)
			{
				vm.message = data;
			}).error(function(error)
			{
//				console.log(error);
				vm.error = error;
			});
		}
	}
})();
'use strict';

angular
	.module('spherecastApp')
	.controller('EditController', function($scope)
{
	$scope.editSphere = function()
	{
	};

	$scope.ok = function()
	{
		$scope.showModal = false;
	};

	$scope.cancel = function()
	{
		$scope.showModal = false;
	};
});
angular
	.module('spherecastApp')
	.controller('SingleFileController', ['$scope', '$http', '$location', 'Upload', function($scope, $http, $location, Upload)
{
	var vm = this;

	$scope.upload = function(file)
	{
		$scope.fileUploading = true;
		$scope.uploadProgressPercentage = 0;
		$scope.uploadProgressString = '';

		$scope.uploadFile = Upload.upload(
		{
			url: '/api/upload',
			data: { mediaFile: file },
		});
		
		$scope.uploadFile.then(function(response)
		{
			if (typeof response.data !== 'undefined')
			{
				if (typeof response.data.code !== 'undefined')
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
//			console.log(error);
			$scope.fileUploading = false;
			$scope.uploadProgressPercentage = 0;
			$scope.uploadProgressString = '';
		}, function(evt)
		{
			$scope.fileUploading = true;
			$scope.uploadProgressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			if ($scope.uploadProgressPercentage < 100)
			{
				$scope.uploadProgressString = $scope.uploadProgressPercentage + '%';
			}
			else
			{
				$scope.uploadProgressString = 'Processing...';
			}
//			console.log($scope.uploadProgressString);
		})
	};

	$scope.cancel = function()
	{
//		$scope.uploadFile.abort();
//		$scope.fileUploading = false;
	};

	$scope.import = function()
	{
		$scope.fileImporting = true;
		$scope.importProgressPercentage = 100;
		$scope.importProgressString = 'Processing...';

		var data = JSON.stringify({ url: $scope.url });
		$http.post('/api/import', data).success(function(item)
		{
//			console.log(item);
			if (typeof item.code !== 'undefined')
			{
				var redirectUrl = '/' + item.code;
				window.location = redirectUrl;
			}
			else
			{
				$scope.url = '';
				$scope.importProgressPercentage = 100;
				$scope.importProgressString = 'Failed!';
			}
		}).error(function(error) {
			vm.error = error;
//			console.log(vm.error);
			$scope.url = '';
			$scope.importProgressPercentage = 100;
			$scope.importProgressString = 'Failed!';
		});
	};
}]);
'use strict';

angular
	.module('spherecastApp')
	.controller('ImportController', ImportController);

function ImportController($scope, $rootScope, $http)
{
	var vm = this;

	vm.items;
	vm.error;

	vm.importProcessed = false;

	vm.getSystemImportedMedia = function()
	{
		$rootScope.pageLoaded = false;

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users.
		$http.get('api/media/list/system').success(function(data) {
			vm.items = data.media;
			vm.items_shown = data.media_shown;
			vm.items_count = data.media_count;
			$rootScope.pageLoaded = true;
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}

	vm.import = function()
	{
		vm.importProcessing = true;
		$http.get('api/media/assign/system').success(function(data) {
			vm.importProcessing = false;
			console.log(data);
			vm.message = data;
			vm.items = [];
			vm.importProcessed = true;
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}

	vm.forget = function()
	{
	}

	vm.getSystemImportedMedia();
}
'use strict';

angular
	.module('spherecastApp')
	.controller('MediaController', MediaController);

function MediaController($scope, $rootScope, $http) {

	var vm = this;

	vm.items;
	vm.error;

	vm.getMedia = function() {

		$rootScope.pageLoaded = false;

		// This request will hit the index method in the AuthenticateController
		// on the Laravel side and will return the list of users
		$http.get('api/media/list').success(function(items) {
			vm.items = items;
			$rootScope.pageLoaded = true;
		}).error(function(error) {
			vm.error = error;
			$rootScope.pageLoaded = true;
		});
	}
	
	vm.getMedia();

	$scope.edit = function(item) {
		$scope.pageEditing = true;
		$scope.currentItem = item;
	}
}
(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('ProfileController', ProfileController);

	function ProfileController($scope, $rootScope, $http, $location, AuthenticatedUser) {
		var vm = this;

		vm.name = $rootScope.authenticatedUser.name;
		vm.email = $rootScope.authenticatedUser.email;

		vm.save = function()
		{
			vm.error = {};
			vm.message = {};

			if (vm.name != null && vm.name.trim() == '')
			{
				vm.error.error_name = 'Please enter a name.';
				return;
			}

			if (vm.email != null && vm.email.trim() == '')
			{
				vm.error.error_email = 'Please enter an email address.';
				return;
			}
/*
			if (vm.oldpassword != null || vm.newpassword != null || vm.verifypassword != null)
			{
				if (vm.oldpassword == null || vm.oldpassword == '')
					vm.error.error_oldpassword = 'Please enter your current password.';

				if (vm.newpassword == null || vm.newpassword == '')
					vm.error.error_newpassword = 'Please enter a new password.';

				if (vm.verifypassword == null || vm.verifypassword == '')
				{
					vm.error.error_verifypassword = 'Please verify your new password.';
					return;
				}
				
				if (vm.newpassword != vm.verifypassword)
				{
					vm.error.error_verifypassword = 'Your passwords don\'t match. Please try again.';
					return;
				}
				return;
			}
*/
			$http.post('api/user/edit', { name: vm.name, email: vm.email, oldpassword: vm.oldpassword, newpassword: vm.newpassword, verifypassword: vm.verifypassword }).success(function(data)
			{
				vm.message = data;
				AuthenticatedUser.refresh();
				vm.oldpassword = '';
				vm.newpassword = '';
				vm.verifypassword = '';
			}).error(function(error)
			{
				vm.error = error;
//				console.log(error);
			})			
		}
	}


})();
(function() {

	'use strict';

	angular
		.module('spherecastApp')
		.controller('UserController', UserController);

	function UserController($http) {

		var vm = this;

		vm.users;
		vm.error;

		vm.getUsers = function() {

			// This request will hit the index method in the AuthenticateController
			// on the Laravel side and will return the list of users
			$http.get('api/authenticate').success(function(users) {
				vm.users = users;
			}).error(function(error) {
				vm.error = error;
			});
		}
	}
	
})();
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
'use strict';

angular
	.module('spherecastApp')
	.directive('bootstrapSwitch', [function() {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                element.bootstrapSwitch();

                element.on('switchChange.bootstrapSwitch', function(event, state) {
                    if (ngModel) {
                        scope.$apply(function() {
                            ngModel.$setViewValue(state);
                        });
                    }
                });

                scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                    if (newValue) {
                        element.bootstrapSwitch('state', true, true);
                    } else {
                        element.bootstrapSwitch('state', false, true);
                    }
                });
            }
        };
    }
]);
'use strict';

angular
	.module('spherecastApp')
	.directive('editSphere', ['$animate', function()
{
	return {
		restrict: 'EA',
		controller: function($scope)
		{
			console.log($scope.currentItem);
		},
		templateUrl: '/partials/editmedia.html',
		replace: false,
		scope: true,
	}
}]);
angular
	.module('spherecastApp')
	.directive('fileModel', ['$parse', function($parse)
{
	return {
		restrict: 'A',
		link: function(scope, element, attrs)
		{
			var model = $parse(attrs.fileModel);
			var modelSetter = model.assign;
			element.bind('change', function()
			{
				scope.$apply(function()
				{
					modelSetter(scope, element[0].files[0]);
				});
			});
		}
	};
}]);
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

		        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 10000 );
		        camera.position.set(0, 0, 0);

		        renderer = new THREE.WebGLRenderer();
		        domElement = renderer.domElement;
		        renderer.setSize( window.innerWidth, window.innerHeight );
		        element[0].appendChild( domElement );

				// Controls
				scope.setControls();

				window.addEventListener('resize', scope.resizeCanvas, false);

		        activeProject = scope.activeProject;
		        console.log(activeProject);
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
						console.log(activeProject);
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
//					renderer.setSize(contW, contH);
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
						stereoEffect.setSize(window.innerWidth, window.innerHeight);
					}
					camera.fov = 90;
					camera.updateProjectionMatrix();

					// Active the DeviceOrientation controls.
					window.addEventListener('deviceorientation', scope.setOrientationControls, true);
				}
				else
				{
					renderer.setSize(window.innerWidth, window.innerHeight);
					camera.fov = 70;
					camera.updateProjectionMatrix();

					// Deactivate the DeviceOrientation controls.
					if (typeof deviceOrientationControls !== 'undefined' && deviceOrientationControls)
						deviceOrientationControls.enabled = false;
					orbitControls.enabled = true;
					orbitControls.update();
				}
			}

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

angular
	.module('spherecastApp')
	.service('AuthenticatedUser', ['$rootScope', '$http', '$auth', '$state', '$location', function($rootScope, $http, $auth, $state, $location)
{
	var vm = this;
	vm.authenticatedUser = {};
	vm.displayName = '';

	this.get = function(forceRetrieve)
	{
		if (typeof forceRetrieve === 'undefined' || forceRetrieve == null)
			forceRetrieve = false;

		if (localStorage.getItem('authenticated_user') == null || localStorage.getItem('authenticated_user') == "" || forceRetrieve == true)
		{
			$http.get('api/user').success(function(data)
			{
				if (data)
				{
					localStorage.setItem('authenticated_user', JSON.stringify(data));
					$rootScope.authenticatedUser = data;
					$rootScope.displayName = data.name;
					vm.authenticatedUser = data;
					vm.displayName = data.name;
					return data;
				}
				return;
			}).error(function(error)
			{
//				console.log(error);
			})
		}
		else
		{
			return JSON.parse(localStorage.getItem('authenticated_user'));
		}
	};

	this.refresh = function()
	{
		$rootScope.authenticatedUser = this.get(true);
	}

	this.can = function(permission)
	{
		return true;
	}

	// Log out if the user is on a login-only state.
	this.logoutIfInvalidState = function(currentState)
	{
		if (typeof currentState === 'undefined')
			$location.path('/logout');

		// TODO: Do some checks to see if the token is present, but invalid. Log out in this case, too.
		// TODO: Retrieve the valid "public" states based on the site settings.
		if (!$auth.isAuthenticated() && currentState.name != '' && currentState.name != 'signup' && currentState.name != 'auth' && currentState.name != 'logout' && currentState.name != 'passwordreset' && currentState.name != 'sendpasswordreset' && currentState.name != 'upload' && currentState.name != 'viewer')
		{
			window.location = '/logout';
		}
	}
}]);
angular
	.module('spherecastApp')
	.service('Project', ['$rootScope', '$http', '$auth', '$state', '$location', function($rootScope, $http, $auth, $state, $location)
{
	var vm = this;

	this.getMediaProject = function(code)
	{
		return $http({ method: 'GET', url: 'api/mediaproject/' + code }).then(function(project)
		{
			return project.data;
		});
	};

	this.get = function(shortname)
	{
	};
}]);
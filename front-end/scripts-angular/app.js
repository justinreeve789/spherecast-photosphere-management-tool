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
				url: '/passwordreset',
				templateUrl: '../views/passwordResetView.html',
				controller: 'AuthController as auth',
			})
			.state('passwordresetprocess', {
				url: '/password?token',
				templateUrl: '../views/passwordResetProcessedView.html',
				controller: 'PasswordResetController as password',
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
				params: {
					embed: false,
				}
			})
			.state('viewerembed', {
				url: '/:code/embed',
				templateUrl: '../views/viewerView.html',
				controller: 'ViewerController as viewer',
				params: {
					embed: true,
				}
			})
			.state('viewer', {
				url: '/:code',
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
			// Check if logins are forced. The list of acceptable states differs from AuthenticatedUser.logoutIfInvalidState()
			// in that uploads won't be available, nor will public galleries once they're implemented.
//			AuthenticatedUser.checkForceLogin(toState);

			// Don't allow access to the signup page if signups are disabled.
			if (toState.name == 'signup' && !$rootScope.site.allow_signups)
				$location.path('/logout');

			// Log out if user is accessing a state they shouldn't.
			AuthenticatedUser.logoutIfInvalidState(toState);

			// Everything's good. Store the token in the root scope.
			$rootScope.authToken = $auth.getToken();

			// If we don't already have a user object, retrieve the user.
			var authUserGet = AuthenticatedUser.get();
			authUserGet.then(function(authUser)
			{
				console.log('--')
				console.log(authUser);
				console.log('//')
				$rootScope.authenticatedUser = authUser;
				$rootScope.displayName = authUser.name;
				$rootScope.pageLoaded = true;
			});

			// The viewer must have "fullscreenViewer" set to true, so we know to add the "overflow-hidden"
			// class to the body. This is set to "true" in the controller. For everything else, just make
			// sure it's false.'
			if (toState.name != 'viewer')
				$rootScope.fullscreenViewer = false;
		});
	}]);
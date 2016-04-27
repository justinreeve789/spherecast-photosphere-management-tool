var app = angular
	.module('spherecastApp', ['ui.router', 'satellizer', 'ngAnimate', 'ngFileUpload'])
	.config(function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider) {

		// Satellizer configuration that specifies which API
		// route the JWT should be retrieved from
		$authProvider.loginUrl = '/api/auth/local';

		$authProvider.google({
			clientId: '812052042695-v4en26h82f35421l3lnhrfjvu8hrmu54.apps.googleusercontent.com',
			url: '/api/auth/google'
		});

		$authProvider.facebook({
//			requiredUrlParams: ['appId'],
			clientId: '990909701004112',
			url: '/api/auth/facebook'
		});

		// Redirect to the upload state if any other states are requested.
		$urlRouterProvider.otherwise('upload');

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
			.state('logout', {
				url: '/logout',
				controller: function($scope, $rootScope, $auth, $location)
				{
					$auth.removeToken();
					delete $rootScope.authToken;
					$location.path('/login');
				},
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
			});

		$locationProvider.html5Mode(true);
	})
	.run(['$rootScope', '$location', '$auth', '$state', function($rootScope, $location, $auth, $state)
	{
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams)
		{
			// TODO: Do some checks to see if the token is present, but invalid. Log out in this case, too.
			if (!$auth.isAuthenticated() && $state.current.name != '' && $state.current.name != 'signup' && $state.current.name != 'auth' && $state.current.name != 'logout' && $state.current.name != 'upload')
			{
				$location.path('/logout');
			}

			// Everything's good. Store the token in the root scope.
			$rootScope.authToken = $auth.getToken();
		});
	}]);
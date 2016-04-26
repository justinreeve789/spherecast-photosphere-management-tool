var app = angular
	.module('spherecastApp', ['ui.router', 'satellizer', 'ngAnimate'])
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

		// Redirect to the auth state if any other states are requested.
		$urlRouterProvider.otherwise('/login');

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
				controller: function($auth, $location)
				{
					localStorage.removeItem('satellizer_token');
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
				controller: 'MultiFileController as singleFile',
			})
			.state('users', {
				url: '/users',
				templateUrl: '../views/userView.html',
				controller: 'UserController as user',
			});

		$locationProvider.html5Mode(true);
	});

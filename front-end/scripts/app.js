(function() {

	'use strict';

	angular
		.module('authApp', ['ui.router', 'satellizer'])
		.config(function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider) {

			// Satellizer configuration that specifies which API
			// route the JWT should be retrieved from
			$authProvider.loginUrl = '/api/auth/local';

			$authProvider.google({
				clientId: '829633846470-sapkpemllj6fh7k4vud0r10c0do4g81u.apps.googleusercontent.com',
				url: '/api/auth/google'
			});

			$authProvider.facebook({
//				requiredUrlParams: ['appId'],
				clientId: '1731105733813404',
				url: '/api/auth/facebook'
			});

			// Redirect to the auth state if any other states are requested other than users
			$urlRouterProvider.otherwise('/login');

			$stateProvider
				.state('auth', {
					url: '/login',
					templateUrl: '../views/authView.html',
					controller: 'AuthController as auth'
				})
				.state('users', {
					url: '/users',
					templateUrl: '../views/userView.html',
					controller: 'UserController as user'
				});

			$locationProvider.html5Mode(true);
		});
})();
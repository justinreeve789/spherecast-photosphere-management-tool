angular
	.module('spherecastApp')
	.service('AuthenticatedUser', ['$rootScope', '$http', '$auth', '$state', '$location', function($rootScope, $http, $auth, $state, $location)
{
	this.get = function()
	{
		if (localStorage.getItem('authenticated_user') == null)
		{
			$http.get('api/user').success(function(data)
			{
				localStorage.setItem('authenticated_user', JSON.stringify(data));
				$rootScope.authenticatedUser = data;
				return data;
			}).error(function(error)
			{
				console.log(error);
			})
		}
		else
		{
			return localStorage.getItem('authenticated_user');
		}
	};

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
		if (!$auth.isAuthenticated() && currentState.name != '' && currentState.name != 'signup' && currentState.name != 'auth' && currentState.name != 'logout' && currentState.name != 'upload' && currentState.name != 'viewer')
		{
			window.location = '/logout';
		}
	}
}]);
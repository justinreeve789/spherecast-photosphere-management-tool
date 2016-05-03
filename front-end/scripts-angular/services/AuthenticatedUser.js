angular
	.module('spherecastApp')
	.service('AuthenticatedUser', ['$rootScope', '$http', '$auth', '$state', '$location', function($rootScope, $http, $auth, $state, $location)
{
	var vm = this;
	vm.authenticatedUser = {};
	vm.displayName = '';

	this.get = function(forceRetrieve = false)
	{
		if (localStorage.getItem('authenticated_user') == null || localStorage.getItem('authenticated_user') == "" || forceRetrieve == true)
		{
			$http.get('api/user').success(function(data)
			{
				if (data)
				{
					console.log(data);
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
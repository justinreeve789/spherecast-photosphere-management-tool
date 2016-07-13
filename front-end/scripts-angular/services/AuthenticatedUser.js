angular
	.module('spherecastApp')
	.service('AuthenticatedUser', ['$rootScope', '$http', '$q', '$auth', '$state', '$location', function($rootScope, $http, $q, $auth, $state, $location)
{
	var vm = this;
	vm.authenticatedUser = {};
	vm.displayName = '';

	this.get = function(forceRetrieve)
	{
		// TODO: Accommodate admin users who can edit any media.
		function can(capability, param)
		{
			var cap = this.capabilities;

			if (typeof cap === 'undefined' || cap === null)
				return false;

			// Site administrators have access to everything. Check this first.
			if (cap['site_admin'] == true)
				return true;

			// Capabilities that require a parameter are handled here.
			if (typeof param !== 'undefined')
			{
				// Capabilities that require the user id are handled here.
				if (typeof param.user_id !== 'undefined')
				{
					if (param.user_id == this.id)
					{
						if (capability == 'edit' || capability == 'delete')
						{
							return cap['edit_title'] || cap['edit_code'] || cap['edit_tags'];
						}

						else if (capability == 'edit_title' || capability == 'edit_code' || capability == 'edit_tags')
						{
							if (typeof cap[capability] !== 'undefined')
								return cap[capability];
						}
					}
				}
			}

			// General capabilities are handled here.
			if (typeof cap[capability] !== 'undefined')
				return cap[capability];

			return false;
		}

		var deferred = $q.defer();

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

					// Add the capabilities/permissions function.
					// TODO: Figure out if there's a better way to do this.
					$rootScope.authenticatedUser['can'] = can;

					vm.authenticatedUser = data;
					vm.displayName = data.name;
//					return data;
				}
				deferred.resolve(data);
			}).error(function(error)
			{
				deferred.reject(error);
//				console.log(error);
			})
		}
		else
		{
//			deferred.resolve(JSON.parse(localStorage.getItem('authenticated_user')));
			vm.authenticatedUser = JSON.parse(localStorage.getItem('authenticated_user'));
			vm.authenticatedUser['can'] = can;
			deferred.resolve(vm.authenticatedUser);
		}
		return deferred.promise;
	};

	this.refresh = function()
	{
		this.get(true);
	}

	// Log out if the user is on a login-only state.
	this.logoutIfInvalidState = function(currentState)
	{
		if (typeof currentState === 'undefined')
			$location.path('/logout');

		// TODO: Do some checks to see if the token is present, but invalid. Log out in this case, too.
		// TODO: Retrieve the valid "public" states based on the site settings.
		if (!$auth.isAuthenticated() && currentState.name != '' && currentState.name != 'signup' && currentState.name != 'auth' && currentState.name != 'logout' && currentState.name != 'passwordresetprocess' && currentState.name != 'passwordreset' && currentState.name != 'sendpasswordreset' && currentState.name != 'upload' && currentState.name != 'viewer' && currentState.name != 'viewerembed')
		{
			window.location = '/logout';
		}
	}

	this.checkForceLogin = function(currentState, site)
	{
		if (typeof currentState === 'undefined')
			$location.path('/logout');

		if ($rootScope.site.force_login == 1)
		{
			// TODO: Do some checks to see if the token is present, but invalid. Log out in this case, too.
			// TODO: Retrieve the valid "public" states based on the site settings.
			if (!$auth.isAuthenticated() && currentState.name != '' && currentState.name != 'signup' && currentState.name != 'auth' && currentState.name != 'logout' && currentState.name != 'passwordresetprocess' && currentState.name != 'passwordreset' && currentState.name != 'sendpasswordreset' && currentState.name != 'viewer' && currentState.name != 'viewerembed')
			{
				window.location = '/logout';
			}
		}
	}
}]);
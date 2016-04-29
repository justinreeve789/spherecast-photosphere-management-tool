angular
	.module('spherecastApp')
	.service('AuthenticatedUser', ['$http', function($http)
{
	this.get = function()
	{
		if (localStorage.getItem('authenticated_user') == null)
		{
			$http.get('api/user').success(function(data)
			{
				localStorage.setItem('authenticated_user', data);
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
}]);
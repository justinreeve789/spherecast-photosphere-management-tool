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
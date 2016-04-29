angular.module('spherecastApp').service('ProviderService', ['$http', 'SatellizerConfig', function($http, SatellizerConfig)
{
	angular.extend(this, {
		init: function() {
	        var that = this;

			$http.get('api/site').success(function(site) {
				console.log(site);
				console.log(SatellizerConfig.providers);
//				SatellizerConfig.providers[''].clientId = data.clientId;
			});
		}
	});
}]);
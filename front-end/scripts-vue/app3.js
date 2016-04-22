Vue.component('media-grid', {
	template: '#media-grid',
	data: function() {
		return {
			list: [],
		};
	},
	created() {
		this.getMedia();
	},
	methods:
	{
		getMedia: function()
		{
			var resource = this.$resource('api/media/list');
			resource.get(function(media)
			{
				this.list = media;
			});
		},
		thumbPath: function(code)
		{
			return '/api/thumb/' + code;
		},
	},
});

var data = {
	media: []
};

var vm = new Vue({
	el: '#app',
	data: data,
	components:
	{
//		'sidebar': sidebar,
	}
});
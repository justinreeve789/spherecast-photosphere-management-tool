var data = {
	plans: [
		{ name: 'Enterprise', price: 100 },
		{ name: 'Starter', price: 50 },
		{ name: 'Basic', price: 0 },
	],
	active: {},
	media: [],
}

new Vue({
	el: '#app',
	data: data,
	components:
	{
		'media-grid':
		{
			props: ['list', 'thumbPath'],

			template: '#media-grid',

			created()
			{
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
		},
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

		deleteTask: function(task)
		{
			this.list.$remove(task);
		},

		clearCompleted: function()
		{
			this.list = this.list.filter(this.inProgress);
		}
	},
})

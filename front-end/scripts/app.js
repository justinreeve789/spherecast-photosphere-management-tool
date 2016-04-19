var data = {
	message: '',
	count: 0,
	points: 50,
	first: 'Justin',
	last: 'Reeve',
};

Vue.component('my-counter', {
	template: '#counter-template',
	props: ['subject'],
	data: function()
	{
		return { count: 0 };
	}
});

new Vue({
	el: '#spherecastApp',
	data: data,
	methods: {
		handleIt: function() {
		},
		updateCount: function() {
			this.count++;
		}
	},
	computed: {
		skill: function() {
			if (this.points <= 100)
				return 'Beginner';
			else
				return 'Advanced';
		},
		fullname: function()
		{
			return this.first + ' ' + this.last;
		}
	},
});
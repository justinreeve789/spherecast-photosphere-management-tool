<!DOCTYPE html>
<html>
    <head>
    	<base href="/">
        <title></title>
        <meta charset="utf-8">
	    <meta http-equiv="X-UA-Compatible" content="IE=edge">
	    <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
	    <meta name="description" content="">
	    <meta name="author" content="">
	    <meta property="og:site_name" content="Spherecast" />
        <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.css" />
        <link rel="stylesheet" href="http://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" />
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans" type="text/css" />
		<link rel="stylesheet" href="assets/css/main.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/media.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/uploader.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/viewer.css" type="text/css" />
		<style type="text/css">
		*
		{
			font-family: 'Open Sans', sans-serif;
		}
		</style>
    </head>
    <body>
    	<script>
<!--
		  window.fbAsyncInit = function() {
		    FB.init({
		      appId      : '990909701004112',
		      xfbml      : true,
		      version    : 'v2.6'
		    });
		  };
		
		  (function(d, s, id){
		     var js, fjs = d.getElementsByTagName(s)[0];
		     if (d.getElementById(id)) {return;}
		     js = d.createElement(s); js.id = id;
		     js.src = "//connect.facebook.net/en_US/sdk.js";
		     fjs.parentNode.insertBefore(js, fjs);
		   }(document, 'script', 'facebook-jssdk'));
-->
		</script>

		<div id="app">

			<div class="container-fluid">
				<media-grid></media-grid>
			</div>

		<template id="media-grid">
			<div class="media-item col-lg-2 col-md-3 col-sm-4 col-xs-12" v-for="item in list">
				<div class="media-item-image">
					<a href="{{ item.code }}" target="_blank">
						<img v-bind:src="thumbPath(item.code)" alt="" />
					</a>
				</div>
				<div class="media-item-info">
					<div class="media-item-code">{{ item.code }}</div>
					<div class="media-item-title">{{ item.title }}</div>
					<div class="media-item-edit">
						<a href="#" @click="showRight = true">
							<i class="fa fa-cog fa-2x"></i>
						</a>
					</div>
				</div>
			</div>
		</template>

		<button class="btn btn-success btn-lg" @click="showRight = true">Show Aside on right</button>
		
		<alert :show.sync="showRight" placement="right" header="Title" :width="350">
		...
		</alert>

		<div style="clear: both;">
			<pre>{{ $media | json }}</pre>
		</div>
		</div>

		<script src="https://code.jquery.com/jquery-2.2.3.min.js" integrity="sha256-a23g1Nt4dtEYOj7bR+vTu7+T8VP13humZFBJNIYoEJo=" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/1.0.21/vue.js"></script>
		<script src="node_modules/vue-resource/dist/vue-resource.js"></script>
		<script src="node_modules/vue-strap/dist/vue-strap.min.js"></script>
		<script src="scripts-vue/app3.js"></script>
    </body>
</html>

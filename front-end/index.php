<!DOCTYPE html>
<html lang="en" class="no-js" xmlns:fb="http://ogp.me/ns/fb#">
    <head>
    	<base href="/">
    	<base target="_parent">
        <title>Cardboard VR Photo Sphere Viewer - Spherecast</title>
        <meta charset="utf-8">
	    <meta http-equiv="X-UA-Compatible" content="IE=edge">
	    <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
	    <meta name="description" content="">
	    <meta name="author" content="">
	    <meta property="og:site_name" content="Spherecast" />
        <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" />
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans" type="text/css" />
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.1/animate.min.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/bootstrap-switch.css" type="text/css" />
		<link rel="stylesheet" href="node_modules/ng-tags-input/build/ng-tags-input.min.css" type="text/css" />
		<link rel="stylesheet" href="node_modules/ng-tags-input/build/ng-tags-input.bootstrap.min.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/main.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/uploader.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/style.css" type="text/css" />
		<script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script>
		<style type="text/css">
		*
		{
			font-family: 'Open Sans', sans-serif;
		}
		</style>
    </head>
    <body ng-app="spherecastApp" ng-class="{'overflow-hidden': fullscreenViewer}">
		<script>
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
		</script>

		<div ui-view></div>

		<div id="page-loader" ng-if="!pageLoaded">
			<i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i>
			<span class="sr-only">Loading...</span>
		</div>
<!--
		<media-edit-directive></media-edit-directive>

	    <div modal="showModal" close="cancel()">
	      <div class="modal-header">
	          <h4>Modal Dialog</h4>
	      </div>
	      <div class="modal-body">
	          <p>Example paragraph with some text.</p>
	      </div>
	      <div class="modal-footer">
	        <button class="btn btn-success" ng-click="ok()">Okay</button>
	        <button class="btn" ng-click="cancel()">Cancel</button>
	      </div>
	    </div>
-->
   </body>

	<!-- Application Dependencies -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
	<script src="node_modules/angular/angular.min.js"></script>
	<script src="node_modules/angular-ui-router/release/angular-ui-router.min.js"></script>
	<script src="node_modules/angular-animate/angular-animate.min.js"></script>
	<script src="node_modules/satellizer/satellizer.min.js"></script>
	<script src="node_modules/ng-file-upload/dist/ng-file-upload.min.js"></script>
	<script src="node_modules/ng-tags-input/build/ng-tags-input.min.js"></script>
	<script src="assets/js/ng-infinite-scroll-1.2.1.min.js"></script>
	<script src="assets/js/three.r76.min.js"></script>

	<!-- Application Scripts -->
	<script src="scripts/main.min.js"></script>
	<script src="scripts/viewer.min.js"></script>
<?php
	if (in_array($_SERVER['REMOTE_ADDR'], ['11111111111111']) && ($_SERVER['REQUEST_URI'] == '/' || trim($_SERVER['REQUEST_URI']) == '/upload'))
	{
?>
		<script src="assets/js/bootstrap-notify.min.js"></script>
		<script src="assets/js/js.cookie.js"></script>
		<script>
		if (typeof Cookies.get('viewedmessage') == 'undefined')
		{
			var notify = $.notify(
			{
				message: "<p>Sorry about the popup, but we happened to notice your Dr. Seuss drawings. Great job, and we're intrigued to know what kind of projects you're doing with these. We've been doing some <a href='https://sphcst.com/07jts' target='_blank'><b>experiments with illustrated photo spheres</b></a>, too.</p><p>If you have time or interest in sharing, please contact us at <a href='mailto:info@spherecast.org'><b>info@spherecast.org</b></a>. And if not, that's fine. This message should disappear when you click the X.</p><p>Thank you for using the Photo Sphere Viewer!</p>",
			},
			{
				delay: 0,
				timer: 0,
				type: 'info',
				placement:
				{
					from: 'bottom',
					align: 'right',
				},
				onClose: function()
				{
					Cookies.set('viewedmessage', 1, { expires: 14 });
				},
			});
		}
		</script>
<?php
	}
?>
</html>
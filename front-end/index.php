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
        <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" />
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans" type="text/css" />
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.1/animate.min.css" type="text/css" />
		<link rel="stylesheet" href="assets/css/bootstrap-switch.css" type="text/css" />
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
	<script src="node_modules/angular/angular.min.js"></script>
	<script src="node_modules/angular-ui-router/release/angular-ui-router.min.js"></script>
	<script src="node_modules/angular-animate/angular-animate.min.js"></script>
	<script src="node_modules/satellizer/satellizer.min.js"></script>
	<script src="node_modules/ng-file-upload/dist/ng-file-upload.min.js"></script>
	<script src="assets/js/ng-infinite-scroll-1.2.1.min.js"></script>
	<script src="assets/js/bootstrap-switch.min.js"></script>
	<script src="assets/js/three.r76.min.js"></script>
	<script src="assets/js/detect-mobile-browser.js"></script>
<!--
	<script src="assets/js/StereoEffect.js"></script>
	<script src="assets/js/DeviceOrientationControlsVR.js"></script>
	<script src="assets/js/OrbitControls.js"></script>
-->

	<!-- Application Scripts -->
<!--
	<script src="scripts-angular/app.js"></script>

	<script src="scripts-angular/controllers/authController.js"></script>
	<script src="scripts-angular/controllers/userController.js"></script>
	<script src="scripts-angular/controllers/profileController.js"></script>
	<script src="scripts-angular/controllers/mediaController.js"></script>
	<script src="scripts-angular/controllers/fileController.js"></script>
	<script src="scripts-angular/controllers/viewerController.js"></script>

	<script src="scripts-angular/directives/bootstrapSwitchDirective.js"></script>
	<script src="scripts-angular/directives/fileDirective.js"></script>
	<script src="scripts-angular/directives/editDirective.js"></script>
	<script src="scripts-angular/directives/viewerDirective.js"></script>

	<script src="scripts-angular/services/AuthenticatedUser.js"></script>
	<script src="scripts-angular/services/Project.js"></script>
-->
	<script src="main.min.js"></script>
	<script src="viewer.min.js"></script>
</html>
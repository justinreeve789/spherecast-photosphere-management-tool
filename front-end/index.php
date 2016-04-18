<!doctype html>
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
    <body ng-app="spherecastApp">
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

        <div class="container">
        	<div ui-view></div>
        </div>        
     
    </body>

    <!-- Application Dependencies -->
    <script src="node_modules/angular/angular.js"></script>
    <script src="node_modules/angular-ui-router/build/angular-ui-router.js"></script>
    <script src="node_modules/satellizer/satellizer.js"></script>

    <!-- Application Scripts -->
    <script src="scripts/app.js"></script>
    <script src="scripts/authController.js"></script>
    <script src="scripts/userController.js"></script>
    <script src="scripts/mediaController.js"></script>
</html>

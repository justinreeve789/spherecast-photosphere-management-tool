<!DOCTYPE html>
<html lang="en" xmlns:fb="http://ogp.me/ns/fb#">
	<head>
	    <base href="{{ $site->url }}/{{ $project->shortname }}">
	    <title>VR Photo Sphere Viewer - {{ $site->url }}/{{ $project->shortname }}</title>

	    <meta property="twitter:card" content="summary" />
	    <meta property="twitter:site" content="@spherecast" />
	    <meta property="twitter:title" content="VR Photo Sphere Viewer - {{ $site->url }}/{{ $project->shortname }}" />
	    <meta property="twitter:description" content="" />
	    <meta property="twitter:image" content="{{ $site->url }}/api/thumb/{{ $project->shortname }}" />
	    <meta property="twitter:url" content="{{ $site->url }}/{{ $project->shortname }}" />

	    <meta property="og:title" content="VR Photo Sphere Viewer - {{ $site->url }}/{{ $project->shortname }}" />
	    <meta property="og:site_name" content="VR Photo Sphere Viewer" />
	    <meta property="og:url" content="{{ $site->url }}/{{ $project->shortname }}" />
	    <meta property="og:description" content="View this photo sphere in your browser, mobile device, or smartphone VR headset." />
	    <meta property="og:image" content="{{ $site->url }}/api/thumb/{{ $project->shortname }}.jpg" />
	    <meta property="og:image:secure_url" content="{{ $site->url }}/api/thumb/{{ $project->shortname }}.jpg" />
	    <meta property="og:image:type" content="image/jpeg" />
	</head>

	<body>
		<p>
			View this photo sphere in your browser, mobile device, or smartphone VR headset.
		</p>
		<img src="{{ $site->url }}/api/thumb/{{ $project->shortname }}" alt="" />
	</body>
</html>
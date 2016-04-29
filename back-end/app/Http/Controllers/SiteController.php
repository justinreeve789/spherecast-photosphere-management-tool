<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Site;

class SiteController extends Controller
{
	/**
	 * Returns the current site with all the providers.
	 */
    public function getCurrentSite()
	{
		$site = Site::current();
		return $site;
//		echo '<pre>'; print_r(json_decode(json_encode($site))); echo '</pre>';
	}
}

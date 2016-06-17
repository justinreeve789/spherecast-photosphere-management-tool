<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\Role;

class Site extends Model
{
	protected $id;
	protected $subdomain;
	protected $domain;
	protected $title;
	protected $created_by;
	protected $shared;
	protected $site_title;

	protected $guarded = ['id'];

	protected $table = 'sites';

	public function media()
	{
		return $this->hasMany('App\Media');
	}

	public function providers()
	{
		return $this->hasMany('App\SiteProvider', 'site_id', 'id');
	}

	public function roles()
	{
		// Check that the site has the following roles defined: guest, user, and admin.
		Role::where('site_id', $this->id)->first();
	}

	public function logos()
	{
		return $this->hasMany('App\Logo', 'site_id', 'id');
	}

	/**
	 * TODO: Fix so Site::current() doesn't return as a JSON string. Eager-load $url.
	 */
	public static function url()
	{
		$site = Site::current();
		$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
		$url = $protocol;
		if ($site->subdomain && $site->subdomain != '')
			$url .= $site->subdomain . '.';
		$url .= $site->domain;
		return $url;
	}

	/**
	 * Return the current site the user is on.
	 * Note that env('APP_URL') is considered the "root" site, and subdomains
	 * are checked against this when determining the current site.
	 *
	 * TODO: Use a global variable to store the current site for repeated calls?
	 */
	public static function current()
	{
//		$app_url = parse_url(\Config::get('app.url'));
		$app_url = parse_url(env('APP_URL'));
		$app_host = $app_url['host'];	// Should be sphcst.com.

		$site_url = parse_url(\URL::to('/'));
		$site_host = $site_url['host'];	// Will either be sphcst.com or {subdomain}.sphcst.com.

		$full_domain = $site_url['scheme'] . '://' . $site_url['host'];
		$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";

		if ($app_host == $site_host)
		{
			// Retrieve the base sphcst.com site.
			// A subdomain should still have "sphcst.com" as the domain.
			$site = Site::with('providers')->with('logos')->where('subdomain', '')->where('domain', $site_host)->first();
			$site->url = $full_domain;
			return $site;
		}
		else
		{
			// Retrieve the subdomain, if one is present. A subdomain can only exist for sphcst.com.
			// If a subdomain is present (non-blank), but a different domain is included, the different
			// domain is ignored and $app_host is used instead.

			// If there's no subdomain, and "domain" is specified, it's a custom domain A custom "domain"
			// can technically be a subdomain of someone's site, such as vr.eduonline.com For our purposes,
			// we just place the whole thing under the "domain" field so we know they're not part of the
			// sphcst.com site.

			// TODO: Fix the preg_match() so it doesn't bother checking for http(s)://
			preg_match('/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/i', $site_host, $match);

			if (!isset($match[1]))
			{
				$subdomain = '';
				$site = Site::with('providers')->where('subdomain', $subdomain)->where('domain', $site_host)->with('logos')->first();
			}
			else
			{
				$subdomain = $match[1];
				$site = Site::with('providers')->where('subdomain', $subdomain)->where('domain', $app_host)->with('logos')->first();
			}

			// If we still don't have a $site by this point, we're dealing with a custom domain, so use the $site_host
			// and check directly for the custom domain.
			if (!$site)
			{
				$site = Site::with('providers')->where('subdomain', '')->where('domain', $site_host)->with('logos')->first();
			}

			$site->url = $full_domain;
			return $site;
		}
		return null;
	}
}
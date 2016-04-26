<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
	protected $id;
	protected $subdomain;
	protected $domain;
	protected $title;
	protected $created_by;
	protected $private;

	protected $guarded = ['id'];

	protected $table = 'sites';

	public function media()
	{
		return $this->hasMany('App\Media');
	}

	/**
	 * Return the current site the user is on.
	 * Note that /Config::get('app.url') is considered the "root" site, and subdomains
	 * are checked against this when determining the current site.
	 */
	public static function current()
	{
		$app_url = parse_url(\Config::get('app.url'));
		$app_host = $app_url['host'];	// Should be sphcst.com.

		$site_url = parse_url(\URL::to('/'));
		$site_host = $site_url['host'];	// Will either be sphcst.com or {subdomain}.sphcst.com.

		if ($app_host == $site_host)
		{
			// Retrieve the base sphcst.com site.
			// A subdomain should still have "sphcst.com" as the domain.
			$site = Site::where('subdomain', '')->where('domain', $site_host)->first();
			return $site;
		}
		else
		{
			// Retrieve the subdomain, if one is present. A subdomain can only exist for sphcst.com.
			// If a subdomain is present (non-blank), but a different domain is included, the different
			// domain is ignored and $app_host is used instead.
			// TODO: Fix the preg_match() so it doesn't bother checking for http(s)://
			preg_match('/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/i', $site_host, $match);

			// If there's no subdomain, and "domain" is specified at this point, it's a custom domain.
			if (!isset($match[1]))
			{
				$subdomain = '';
				$site = Site::where('subdomain', $subdomain)->where('domain', $site_host)->first();
			}
			else
			{
				$subdomain = $match[1];
				$site = Site::where('subdomain', $subdomain)->where('domain', $app_host)->first();
			}
			return $site;
		}
		return null;
	}
}
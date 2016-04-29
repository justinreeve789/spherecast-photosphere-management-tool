<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class SiteProvider extends Model
{
	protected $site_id;
	protected $auth_provider;
	protected $app_id;
	protected $secret;
	protected $enabled;

	protected $table = 'sites_providers';
	protected $guarded = [];
	protected $hidden = ['secret'];

	public function site()
	{
		return $this->belongsTo('sites', 'site_id', 'id');
	}
}

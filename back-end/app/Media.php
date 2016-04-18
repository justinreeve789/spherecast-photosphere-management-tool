<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
	protected $id;
	protected $code;
	protected $mode;
	protected $title;
	protected $site_id;
	protected $user_id;
	protected $visible;
//	protected $created_at;
//	protected $updated_at;

	protected $guarded = ['id'];

	protected $table = 'media';

	public function site()
	{
		return $this->belongsTo('App\Site', 'site_id', 'id');
	}

	public function media_files()
	{
		return $this->hasMany('App\MediaFile', 'media_id', 'id');
	}

	public function files()
	{
	}

	public function thumbs()
	{
		return $this->hasMany('App\Thumb', 'media_id', 'id');
	}
}
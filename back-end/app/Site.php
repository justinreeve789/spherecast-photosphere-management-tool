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
}
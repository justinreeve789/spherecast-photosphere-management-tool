<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
	protected $guarded = ['id'];
	protected $table = 'subscriptions';
/*
	public function sites()
	{
		return $this->hasMany('sites', 'site_id', 'id');
	}
*/
}
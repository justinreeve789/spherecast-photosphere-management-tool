<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
	protected $guarded = ['id'];
	protected $table = 'access';

	public function users()
	{
		return $this->hasMany('users', 'user_id', 'id');
	}
}
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class UserCapability extends Model
{
	protected $guarded = [];
	protected $table = 'users_capabilities';
}

<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Log;

class UserCapability extends Model
{
	protected $guarded = [];
	protected $table = 'users_capabilities';
}

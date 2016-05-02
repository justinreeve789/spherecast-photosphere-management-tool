<?php

namespace App;
namespace Site;

use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
	protected $email;
	protected $token;

	protected $fillable = ['email', 'token'];
	protected $table = 'password_resets';

	public function user()
	{
		$site = Site::current();

		return $this->belongsTo('User', 'email', 'email')
					->where('site_id', $site->id)
					->where('auth_provider', 'local');
	}
}

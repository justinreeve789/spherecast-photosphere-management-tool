<?php
namespace App;

use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use App\Access;
use App\Site;

class User extends Model implements AuthenticatableContract, CanResetPasswordContract
{
    use Authenticatable, CanResetPassword;

	protected $id;
	protected $site_id;
	protected $role_id;
	protected $email;
	protected $password;
	protected $name;
	protected $auth_provider;
	protected $auth_provider_id;
	protected $remember_token;

    protected $guarded = ['id'];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = ['password', 'remember_token'];

	protected $table = 'users';

	public function site()
	{
		return $this->belongsTo('App\Site', 'site_id', 'id');
	}

	public function access()
	{
		return $this->hasOne('App\Access', 'id', 'access_id');
	}
}

<?php
namespace App;

use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Access;
use App\Site;
use Log;

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
	protected $check_imports;
	protected $remember_token;
	protected $capabilities;

    protected $guarded = ['id'];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = ['password', 'remember_token'];

	protected $table = 'users';

	public static function get()
	{
		$auth_user_id = \Auth::user()->attributes['id'];
		$user = User::where('id', $auth_user_id)->with('capabilities')->first();
		return $user;
	}

	public function site()
	{
		return $this->belongsTo('App\Site', 'site_id', 'id');
	}

	public function access()
	{
		return $this->hasOne('App\Access', 'id', 'access_id');
	}

	public function capabilities()
	{
		return $this->hasOne('App\UserCapability', 'user_id', 'id');
	}

	// TODO: Consider using the native Laravel can().
	public function can($capability, $param = null)
	{
		$capabilities = $this->toArray()['capabilities'];

		if (!$capabilities)
			return false;

		// Site administrators have access to everything. Check this first.
		if (isset($capabilities['site_admin']) && $capabilities['site_admin'] == true)
		{
//			Log::info('site admin');
			return true;
		}

		// Special case for view_limit, requires $param.
		if ($capability == 'view_limit')
		{
			if (isset($param) && is_numeric($param))
				return $capabilities['view_limit'] >= $param;
			else
				return false;
		}

		// Special case for edit, requires $param.
		if (in_array($capability, ['edit', 'delete', 'edit_title', 'edit_description', 'edit_code', 'edit_tags']) && isset($param) && is_numeric($param))
		{
			// TODO: Check for admin users who can edit or delete.
			// TODO: Cache the media object so we don't have to call it multiple times with multiple permission checks.
			$media_id = $param;
			$media = Media::where('user_id', $capabilities['user_id'])->where('id', $media_id)->first();
			if ($media)
			{
				if ($capability == 'edit' || $capability == 'delete')
					return true;

				return isset($capabilities[$capability]) && $capabilities[$capability] == true;
			}
			else
				return false;
		}

		if (isset($capabilities[$capability]))
			return $capabilities[$capability];
		else
			return false;
	}
}

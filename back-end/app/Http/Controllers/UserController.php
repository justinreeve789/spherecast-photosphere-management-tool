<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use Auth;
use App\PasswordReset;
use App\Site;
use App\User;
use Input;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Hash;
use Mail;

class UserController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to the methods in this controller.
        $this->middleware('jwt.auth', ['except' => ['confirmResetPassword', 'processResetPassword']]);
    }

	/**
	 * Retrieve the currently logged-in user object with access levels for the current site.
	 */
	public function getCurrentUser()
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not retrieve site.'], 401);

		$user = Auth::user();
		if (!$user)
			return response()->json(['error_general' => 'User not authenticated.'], 401);

		// TODO: Retrieve the access with the Auth::user() command.
//		$user = User::with('access')->where('id', $user->id)->first();
		$user = User::where('id', $user->id)->first();
		return $user;
	}

	/**
	 * Retrieve a specific user for the current site. This is used for user management, and will require a
	 * user by logged-in. We'll also want to make sure the authenticated user is allowed to retrieve this
	 * user object.
	 */
	public function getUser($id)
	{
	}

	/**
	 * Save local user.
	 */
	public function saveUser(Request $request)
	{
		// Get the logged-in user.
		$user = \Auth::user();
		if (!$user)
			return response()->json(['error_general' => 'Could not retrieve user.'], 401);		

		if ($user->auth_provider == 'local')
			$fields = $request->only('name', 'email', 'oldpassword', 'newpassword', 'verifypassword');
		else
			$fields = $request->only('name');

		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Invalid site.'], 401);

		if ($user)
		{
			// Validate the data.
			$name = $fields['name'];

			if ($name != null && trim($name) == '')
				return response()->json(['error_name' => 'Please enter your name.'], 401);

			if ($name != null)
				$user->name = trim($name);

			if ($user->auth_provider == 'local')
			{
				$email = $fields['email'];
				$oldpassword = $fields['oldpassword'];
				$newpassword = $fields['newpassword'];
				$verifypassword = $fields['verifypassword'];

				if ($email != null)
				{
					if (isset($email) && trim($email) == '')
						return response()->json(['error_email' => 'Please enter your email address.'], 401);

					// Make sure the email address is valid.
					if (!filter_var($email, FILTER_VALIDATE_EMAIL))
						return response()->json(['error_email' => 'Please enter a valid email address. ' . $email], 401);
				
					// If a new email is specified, make sure it's not already being used on the site with the
					// "local" auth_provider.
					$email = trim(strtolower($email));
					if ($email != strtolower($user->email))
					{
						$check_user = User::where('email', trim(strtolower($email)))->where('site_id', $site->id)->where('auth_provider', 'local')->first();
						if ($check_user)
							return response()->json(['error_email' => 'This email address is already being used.'], 401);
					}
					$user->email = $email;
				}
				else
					return response()->json(['error_email' => 'Please enter a valid email address. ' . $email], 401);

				if (($oldpassword || $newpassword || $verifypassword) && ($oldpassword != '' || $newpassword != '' || $verifypassword != ''))
				{
					if (!isset($oldpassword) || $oldpassword == '')
						return response()->json(['error_oldpassword' => 'Please enter your current password.'], 401);

					if (!password_verify($oldpassword, $user->password))
						return response()->json(['error_oldpassword' => 'Your current password is incorrect. Please try again.'], 401);

					if (!isset($newpassword) || $newpassword == '')
						return response()->json(['error_newpassword' => 'Please enter a new password.'], 401);

					if (!isset($verifypassword) || $verifypassword == '')
						return response()->json(['error_verifypassword' => 'Please verify your new password.'], 401);

					if ($newpassword != $verifypassword)
						return response()->json(['error_verifypassword' => 'Your passwords don\'t match. Please try again.'], 401);

					// Make sure the password is complex enough: 1 number, 1 letter, 8 or more characters.
//					if (!preg_match('/^(?=.*\d)(?=.*[A-Za-z])[0-9A-Za-z!@#$%]{8,64}$/', $newpassword))
//						return response()->json(['error_verifypassword' => 'Your password is not strong enough. It must have at least 1 number, 1 letter, and 8 or more characters.']);

					// Update the password.
					$user->password = Hash::make($newpassword);
				}
			}

			if ($user->save())
				return response()->json(['message_general' => 'Your profile changes have been saved.'], 201);
			else
				return response()->json(['error_general' => 'Could not save changes.'], 401);
		}
		return response()->json(['error_general' => 'User account could not be retrieved.'], 401);
	}

	/**
	 * Send an email asking the user to confirm the password reset, and give them a link to process
	 * the reset.
	 */
	public function confirmResetPassword()
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not determine site.'], 401);

		// Make sure we have a user with the email.
		$email = Input::get('email');
		$email = trim(strtolower($email));
		if ($email == null || $email == '')
			return response()->json(['error_email' => 'Please enter a valid email address.'], 401);

		// Delete any existing password reset records for this user.
		PasswordReset::where('email', $email)->delete();

		$password_reset = new PasswordReset;
		$password_reset->email = $email;

		$user = $password_reset->user();

		if (!$user)
			return response()->json(['error_email' => 'This email does not belong to a registered account.'], 401);

		$password_reset->token = $this->generateToken();
		$password_reset->created_at = date('Y-m-d H:i:s');
		$password_reset->timestamps = false;
		if (!$password_reset->save())
			return response()->json(['error_email' => 'An error occurred while generating the verification code. Please try again.'], 401);

		// Email the confirmation URL.
		$site_host = $site->url;
		if (!$site_host)
			return response()->json(['error_general' => 'Could not determine site host.'], 401);

		$params = [
			'site_domain' => $site->domain,
			'site_host' => $site_host,
			'reset_url' => $site_host . '/passwordreset?token=' . $password_reset->token,
		];

		$mail = Mail::send('emails.verifyresetpassword', $params, function($m) use ($user, $site, $site_host)
		{
//			$m->from('donotreply@' . $site->domain, 'Do Not Reply');
			$m->from('donotreply@sphcst.com', 'Do Not Reply');
			$m->to($user->email, $user->name)->subject('You have requested a new password on ' . $site_host);
		});

		error_log($site->url);

		if (!$mail)
			return response()->json(['error_email' => 'An error occurred in sending the confirmation email. Please try again.'], 401);

		return response()->json(['message_general' => 'You should receive an email with a link to reset your password within the next 15 minutes. This link will expire in 24 hours.'], 201);
	}

	/**
	 * Generate a random password and send it to the specific email.
	 */
	public function processResetPassword()
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not determine site.'], 401);

		// Get the user for the password token.
//		PasswordReset::where('token' => )

		// Generate new password.
		$password = $this->generatePassword();

		$user->password = Hash::make($password);
		if (!$user->save())
			return response()->json(['error_general' => 'Could not reset password.'], 401);
		else
		{
		}
	}

	protected function generateToken()
	{
		return hash('sha256', $this->generatePassword());
	}

	protected function generatePassword($chars = 8)
	{
		$alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@$!@$!@$!@$!@$';
		$pass = array();
		$alpha_length = strlen($alphabet) - 1;
		for ($i = 0; $i < $chars; $i++)
		{
			$n = rand(0, $alpha_length);
			$pass[] = $alphabet[$n];
		}
		return implode($pass);
	}

	/**
	 * Set the check_imports flag.
	 * If the flag is 1, imports are checked at login.
	 * If the flag is 0, imports are not checked at login, but the "Import previous uploads" button is still present in the Profile.
	 * If the flag is -1, imports are not checked at login, and the "Import previous uploads" button is not present in the Profile.
	 */
	public function disableCheckImports()
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not determine site.'], 401);

		// Get the logged-in user.
		$user = \Auth::user();
		if (!$user)
			return response()->json(['error_general' => 'Could not retrieve user.'], 401);		

		$flag = \Input::get('flag');
		if (!isset($flag) || !$flag)
			$flag = 0;
		if ($flag != 0 && $flag != -1)
			$flag = 0;

		$user->check_imports = $flag;

		if ($user->save())
			return response()->json(['message_general' => 'Import checking disabled.'], 201);
		else
			return response()->json(['error_general' => 'Could not disable import checking.'], 401);
	}
}

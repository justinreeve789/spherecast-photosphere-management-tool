<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use Auth;
use App\Access;
use App\Site;
use App\User;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Hash;

class UserController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to the methods in this controller.
        $this->middleware('jwt.auth');
    }

	/**
	 * Retrieve the currently logged-in user object with access levels for the current site.
	 */
	public function getCurrentUser()
	{
		$site = Site::current();
		if (!$site)
			return null;

		$user = Auth::user();

		// TODO: Retrieve the access with the Auth::user() command.
		$user = User::with('access')->where('id', $user->id)->first();
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

		$name = $fields['name'];

		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Invalid site.'], 401);

		if ($user)
		{
			// Validate the data.
			if (isset($name) && trim($name) == '')
				return response()->json(['error_name' => 'Please enter your name.'], 401);

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
					if (!filter_var($email, FILTER_VALIDATE_EMAIL) !== false)
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

				if ($oldpassword || $newpassword || $verifypassword)
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
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use Auth;
use App\Access;
use App\Site;
use App\User;

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
}

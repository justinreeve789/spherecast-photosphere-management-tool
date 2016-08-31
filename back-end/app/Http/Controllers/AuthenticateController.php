<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Hash;
use App\Site;
use App\User;
use App\UserSite;
use Config;
use GuzzleHttp;
use GuzzleHttp\Subscriber\Oauth\Oauth1;

class AuthenticateController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to all methods in this controller
        // except for the authenticate method. We don't want to prevent
        // the user from retrieving their token if they don't already have it
        $this->middleware('jwt.auth', ['except' => ['createLocalUser', 'authenticateLocal', 'authenticateGoogle', 'authenticateFacebook']]);
    }

    /**
     * Return the user
     *
     * @return Response
     */
    public function index()
    {
        // Retrieve all the users in the database and return them        
        $users = User::all();

        return $users;
    }


	/**
	 * Return a JWT.
	 * TODO: Take into account if a site is allowing new signups.
	 *
	 * @return Response
	 */
	public function createLocalUser(Request $request)
	{
		$credentials = $request->only('name', 'email', 'password', 'verifypassword');
		$email = strtolower(trim($credentials['email']));
		$name = trim($credentials['name']);
		$password = $credentials['password'];
		$verifypassword = $credentials['verifypassword'];

		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Invalid site.'], 401);

		// Make sure all the fields are present.
		if ($name == '')
			return response()->json(['error_name' => 'Please enter a name.'], 401);

		if ($email == '')
			return response()->json(['error_email' => 'Please enter an email.'], 401);

		if ($password == '')
			return response()->json(['error_password' => 'Please enter a password.'], 401);

		if ($verifypassword == '')
			return response()->json(['error_verifypassword' => 'Please verify your password.'], 401);

		// Make sure the passwords match.
		if ($credentials['password'] != $credentials['verifypassword'])
			return response()->json(['error_verifypassword' => 'The passwords you entered don\'t match.'], 401);

		// Make sure the password is complex enough: 1 number, 1 letter, 8 or more characters.
//		if (!preg_match('/^(?=.*\d)(?=.*[A-Za-z])[0-9A-Za-z!@#$%]{8,64}$/', $password))
//			return response()->json(['error_verifypassword' => 'Your password is not strong enough. It must have at least 1 number, 1 letter, and 8 or more characters.']);

		// Make sure the email is valid.
		if (!filter_var($email, FILTER_VALIDATE_EMAIL) !== false)
			return response()->json(['error_email' => 'Please enter a valid email address.'], 401);

		// Make sure the account doesn't already exist. Force to lowercase, even though
		// technically emails are case-sensitive.
		$user = User::where('email', $email)->where('site_id', $site->id)->where('auth_provider', 'local')->first();
		if ($user)
			return response()->json(['error_email' => 'This email already belongs to a registered account.'], 401);

		if (!$user)
		{
			// No user found, create account.
			$new = new User;
			$new->site_id = Site::current()->id;
			$new->name = $name;
			$new->email = $email;
			$new->password = Hash::make($password);
			$new->auth_provider = 'local';
			$new->remember_token = '';
			$new->save();

			$user = $new;
		}

		if ($user)
		{
			// Return the token.
			$token = JWTAuth::fromUser($user);
			return response()->json(['token' => $token]);
		}
		else
			return response()->json(['error_general' => 'Something went wrong! Your account was not created.'], 401);
	}

    /**
     * Return a JWT
     *
     * @return Response
     */
    public function authenticateLocal(Request $request)
    {
        $credentials = $request->only('email', 'password');
/*
        try {
            // verify the credentials and create a token for the user
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'could_not_create_token'], 500);
        }
*/
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Site not found.'], 401);

		$user = User::where('email', $credentials['email'])->where('site_id', $site->id)->where('auth_provider', 'local')->first();
		if (!$user)
		{
			return response()->json(['error_email' => 'This email is not registered on the site'], 401);
		}

		if (!password_verify($credentials['password'], $user->password))
		{
			return response()->json(['error_password' => 'Password not correct'], 401);
		}
		$token = JWTAuth::fromUser($user);

        // if no errors are encountered we can return a JWT
        return response()->json(compact('token'));
    }

	public function authenticateGoogle(Request $request, $provider = 'google')
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Site not found.'], 401);

		foreach ($site->providers as $p)
		{
			if ($p->auth_provider == 'google')
			{
				$secret_config = $p->secret;
				break;
			}
		}

		if (!isset($secret_config))
			return;

        $params = [
            'code' => $request->input('code'),
            'client_id' => $request->input('clientId'),
            'client_secret' => $secret_config,
            'redirect_uri' => $request->input('redirectUri'),
            'grant_type' => 'authorization_code',
        ];

		$client = new GuzzleHttp\Client();

        // Exchange authorization code for access token.
		$accessTokenResponse = $client->request('POST', 'https://accounts.google.com/o/oauth2/token', [
//		$accessTokenResponse = $client->request('POST', 'https://accounts.google.com/o/oauth2/v2/auth', [
			'form_params' => $params
		]);
//		error_log(print_r($params, true));

        $accessToken = json_decode($accessTokenResponse->getBody(), true);

        // Retrieve profile information about the current user.
		$profileResponse = $client->request('GET', 'https://www.googleapis.com/plus/v1/people/me/openIdConnect', [
		    'headers' => array('Authorization' => 'Bearer ' . $accessToken['access_token'])
		]);
        $profile = json_decode($profileResponse->getBody(), true);

		// TODO: If the user is already signed in, link accounts.

		// Check if the account already exists.
		$user = \App\User::where(['site_id' => $site->id, 'auth_provider' => $provider, 'email' => $profile['email']])->first();
		if (!$user)
		{
			// No user found, create account.
			$new = new \App\User;
			$new->site_id = Site::current()->id;
			$new->name = $profile['name'];
			$new->email = $profile['email'];
			$new->password = '{}';
			$new->auth_provider = $provider;
			$new->auth_provider_id = $profile['sub'];
			$new->remember_token = $accessToken['access_token'];
			$new->save();

			$user = $new;
		}

		if ($user)
		{
			// Return the token.
			$token = JWTAuth::fromUser($user);
			return response()->json(['token' => $token]);
		}
	}

	public function authenticateFacebook(Request $request, $provider = 'facebook')
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Site not found.'], 401);

		foreach ($site->providers as $p)
		{
			if ($p->auth_provider == 'facebook')
			{
				$secret_config = $p->secret;
				break;
			}
		}

		if (!isset($secret_config))
			return;

        $params = [
            'code' => $request->input('code'),
            'client_id' => $request->input('clientId'),
            'client_secret' => $secret_config,
            'redirect_uri' => $request->input('redirectUri'),
            'grant_type' => 'authorization_code',
        ];

        $client = new GuzzleHttp\Client();

        // Exchange authorization code for access token.
		$accessTokenResponse = $client->request('GET', 'https://graph.facebook.com/v2.6/oauth/access_token', [
			'query' => $params
		]);
        $accessToken = json_decode($accessTokenResponse->getBody(), true);

        // Retrieve profile information about the current user.
		$fields = 'id,email,first_name,last_name,link,name';
		$profileResponse = $client->request('GET', 'https://graph.facebook.com/v2.6/me', [
			'query' => [
				'access_token' => $accessToken['access_token'],
				'fields' => $fields
			]
		]);

		$profile = json_decode($profileResponse->getBody(), true);

		// TODO: If the user is already signed in, link accounts.

		// Check if the account already exists.
		$user = \App\User::where(['auth_provider' => $provider, 'email' => $profile['email']])->first();
		if (!$user)
		{
			// No user found, create account.
			$new = new \App\User;
			$new->site_id = Site::current()->id;
			$new->name = $profile['name'];
			$new->email = $profile['email'];
			$new->password = '{}';
			$new->auth_provider = $provider;
			$new->auth_provider_id = $profile['id'];
			$new->remember_token = $accessToken['access_token'];
			$new->save();

			$user = $new;
		}

		if ($user)
		{
			// Return the token.
			$token = JWTAuth::fromUser($user);
			return response()->json(['token' => $token]);
		}
	}
}
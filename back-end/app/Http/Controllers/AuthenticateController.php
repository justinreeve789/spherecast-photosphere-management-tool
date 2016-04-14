<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\User;
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
        $this->middleware('jwt.auth', ['except' => ['authenticateLocal', 'authenticateGoogle', 'authenticateFacebook']]);
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
		$user = User::where('email', $credentials['email'])->first();
		if (!$user || !password_verify($credentials['password'], $user->password))
		{
			return response()->json(['error' => 'invalid_credentials'], 401);
		}
		$token = JWTAuth::fromUser($user);

        // if no errors are encountered we can return a JWT
        return response()->json(compact('token'));
    }

	public function authenticateGoogle(Request $request, $provider = 'google')
	{
		$secret_config = 'custom.' . $provider . '_secret';
        $params = [
            'code' => $request->input('code'),
            'client_id' => $request->input('clientId'),
            'client_secret' => Config::get($secret_config),
            'redirect_uri' => $request->input('redirectUri'),
            'grant_type' => 'authorization_code',
        ];

        $client = new GuzzleHttp\Client();

        // Exchange authorization code for access token.
		$accessTokenResponse = $client->request('POST', 'https://accounts.google.com/o/oauth2/token', [
            'form_params' => $params
		]);
        $accessToken = json_decode($accessTokenResponse->getBody(), true);

        // Retrieve profile information about the current user.
		$profileResponse = $client->request('GET', 'https://www.googleapis.com/plus/v1/people/me/openIdConnect', [
		    'headers' => array('Authorization' => 'Bearer ' . $accessToken['access_token'])
		]);
        $profile = json_decode($profileResponse->getBody(), true);

		// TODO: If the user is already signed in, link accounts.

		// Check if the account already exists.
		$user = \App\User::where(['auth_provider' => $provider, 'email' => $profile['email']])->first();
		if (!$user)
		{
			// No user found, create account.
			$new = new \App\User;
			$new->name= $profile['name'];
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
		$secret_config = 'custom.' . $provider . '_secret';
        $params = [
            'code' => $request->input('code'),
            'client_id' => $request->input('clientId'),
            'client_secret' => Config::get($secret_config),
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

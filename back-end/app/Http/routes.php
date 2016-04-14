<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', function()
{
    return view('index');
});

Route::group(['prefix' => ''], function()
{
	Route::resource('authenticate', 'AuthenticateController', ['only' => ['index']]);
	Route::post('auth/local', 'AuthenticateController@authenticateLocal');
	Route::post('auth/google', 'AuthenticateController@authenticateGoogle');
	Route::post('auth/facebook', 'AuthenticateController@authenticateFacebook');
});

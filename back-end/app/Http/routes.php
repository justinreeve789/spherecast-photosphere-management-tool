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

Route::get('/', ['uses' => 'MediaController@showMediaGrid']);

Route::get('/user', ['uses' => 'UserController@getUser']);
Route::post('/user', ['uses' => 'AuthenticateController@createLocalUser']);
Route::get('/site', ['uses' => 'MediaController@getCurrentSite']);
Route::get('/list', ['uses' => 'MediaController@showMediaGrid']);
Route::get('/upload', ['uses' => 'MediaController@showUpload']);
Route::post('/upload', ['uses' => 'MediaController@processUpload']);
Route::get('/media/list', ['uses' => 'MediaController@getMedia']);
Route::get('/media/{code}', ['uses' => 'MediaController@downloadMedia']);
Route::get('/thumb/{code}', ['uses' => 'MediaController@downloadThumbnail']);
Route::get('/thumb/{code}/{width}', ['uses' => 'MediaController@downloadThumbnail']);
Route::get('/thumb/{code}/{width}/{height}', ['uses' => 'MediaController@downloadThumbnail']);
Route::get('/{code}', ['uses' => 'MediaController@viewMedia']);

Route::group(['prefix' => ''], function()
{
	Route::resource('authenticate', 'AuthenticateController', ['only' => ['index']]);
	Route::post('auth/local', 'AuthenticateController@authenticateLocal');
	Route::post('auth/google', 'AuthenticateController@authenticateGoogle');
	Route::post('auth/facebook', 'AuthenticateController@authenticateFacebook');
});

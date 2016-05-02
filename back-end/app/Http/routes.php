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

Route::get('/user', ['uses' => 'UserController@getCurrentUser']);
Route::post('/user', ['uses' => 'AuthenticateController@createLocalUser']);
Route::post('/user/edit', ['uses' => 'UserController@saveUser']);
Route::post('/user/resetpassword', ['uses' => 'UserController@confirmResetPassword']);
Route::get('/user/resetpassword', ['uses' => 'UserController@resetPassword']);
Route::get('/site', ['uses' => 'SiteController@getCurrentSite']);
Route::get('/list', ['uses' => 'MediaController@showMediaGrid']);
Route::get('/upload', ['uses' => 'MediaController@showUpload']);
Route::post('/upload', ['uses' => 'MediaController@processUpload']);
Route::get('/import', ['uses' => 'MediaController@importFile']);
Route::post('/import', ['uses' => 'MediaController@importFile']);
Route::get('/media/list', ['uses' => 'MediaController@getMediaForSite']);
Route::get('/media/get/{code}', ['uses' => 'MediaController@getMedia']);
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

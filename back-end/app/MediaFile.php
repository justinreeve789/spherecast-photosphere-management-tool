<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
	protected $media_id;
	protected $file_id;
	protected $position;

	protected $fillable = ['media_id', 'file_id', 'position'];

	protected $table = 'media_files';

	public function media()
	{
		return $this->belongsTo('App\Media', 'media_id', 'id');
	}

	public function files()
	{
		return $this->hasMany('App\FileItem', 'file_id', 'id');
	}
}
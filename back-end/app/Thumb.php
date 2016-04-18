<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Thumb extends Model
{
	protected $id;
	protected $media_id;
	protected $stored_filename;
	protected $stored_extension;
	protected $width;
	protected $height;

	protected $table = 'thumbs';

	protected $guarded = ['id'];

	public function media()
	{
		return $this->belongsTo('media', 'media_id', 'id');
	}
}
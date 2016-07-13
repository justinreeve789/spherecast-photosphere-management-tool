<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MediaTag extends Model
{
	protected $id;
	protected $media_id;
	protected $text;

	protected $fillable = ['media_id', 'text'];

	protected $table = 'media_tags';

	public function media()
	{
		return $this->belongsTo('App\Media', 'media_id', 'id');
	}
}

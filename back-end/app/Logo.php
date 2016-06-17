<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Logo extends Model
{
	protected $id;
	protected $site_id;
	protected $file_id;
	protected $type;	// Can be site or viewer.
	protected $size;	// Can be large, medium, or small.
	protected $original_filename;
	protected $original_extension;

	protected $guarded = ['id'];

	protected $table = 'logos';

	public function site()
	{
		return $this->belongsTo('App\Site', 'site_id', 'id');
	}

	public function file()
	{
		$file_id = $this->attributes['file_id'];	// Why can't we use $this->file_id?
		$file = FileItem::where('id', $file_id)->first();
		return $file;
	}
}

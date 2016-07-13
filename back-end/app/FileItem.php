<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Log;

class FileItem extends Model
{
	protected $id;
	protected $stored_filename;
	protected $stored_extension;
	protected $mimetype;
	protected $filesize;
	protected $ip;

	protected $guarded = ['id'];

	protected $table = 'files';

	public function getId()
	{
		return $this->attributes['id'];
	}

	public function media()
	{
		return $this->belongsTo('App\MediaFile', 'file_id', 'id');
	}

	public function file_exists()
	{
		$file_path = \Config::get('custom.upload_path') . '/' . $this->stored_filename . '.' . $this->stored_extension;
		return is_file($file_path) && file_exists($file_path);
	}

	public function file_path()
	{
		$file_path = \Config::get('custom.upload_path') . '/' . $this->attributes['stored_filename'] . '.' . $this->attributes['stored_extension'];
		if (is_file($file_path))
			return $file_path;
		else
			return null;
	}

	// TODO: Create a shouldDelete() function to check 
	public function shouldDelete()
	{
		// We'll do one check to make sure that absolutely no media items are pointing to this
		// file before deleting it.
//		Log::info('File: ' . print_r($this, true));

		$file_id = $this->getId();
		if (!$file_id)
		{
			throw new \Exception('File id not set');
		}

		$media_files_count = MediaFile::where('file_id', $file_id)->count();
		if ($media_files_count != 0)
			return false;

		return true;
	}

	public function delete()
	{
		if ($this->shouldDelete())
		{
			$file_path = $this->file_path();
			if ($file_path)
			{
				if (unlink($file_path))
				{
					return true;
				}
			}
			parent::delete();
		}
	}
}
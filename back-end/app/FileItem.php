<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

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
		$file_path = \Config::get('custom.upload_path') . '/' . $this->stored_filename . '.' . $this->stored_extension;
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
		$media_files_count = MediaFile::where('file_id', $this->id)->count();
		if ($media_files_count != 0)
			return false;

		$file_path = \Config::get('custom.upload_path') . '/' . $this->stored_filename . '.' . $this->stored_extension;
		if (is_file($file_path))
		{
			if (unlink($file_path))
			{
				return true;
			}
		}
		return false;
	}

	public function delete()
	{
		if ($this->shouldDelete())
			parent::delete();
	}
}
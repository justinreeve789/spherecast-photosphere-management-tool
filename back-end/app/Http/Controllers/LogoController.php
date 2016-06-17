<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Http\Requests;
use App\FileItem;
use App\Media;
use App\MediaFile;
use App\Site;
use App\Thumb;
use App\User;
use Config;
use DB;
use QrCode;

class LogoController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to all methods in this controller
        // except for the authenticate method. We don't want to prevent
        // the user from retrieving their token if they don't already have it
        $this->middleware('jwt.auth', ['except' => ['downloadLogo']]);
    }

	public function downloadLogo($type)
	{
		$site = Site::current();
		if (isset($site->logos))
		{
			foreach ($site->logos as $logo)
			{
				if ($logo->type == $type)
				{
					// Make sure the file exists.
					$file_item = FileItem::where('id', $logo->file_id)->first();
					if ($file_item)
					{
						$filename_ext = $file_item->stored_filename . '.' . $file_item->stored_extension;
						$file_path = Config::get('custom.upload_path') . '/' . $filename_ext;
						if (file_exists($file_path))
						{
							$headers = [
								'Content-Type: ' . isset($file_item->mimetype) ? $file_item->mimetype : 'image/png'
							];
							return \Response::download($file_path, $filename_ext, $headers);
						}
					}
				}
			}
		}

		// Return a blank image.
		$filename_ext = 'blank.png';
		$file_path = base_path() . '/resources/assets/images/blank-1px.png';
		$headers = [
			'Content-Type: image/png'
		];
		return \Response::download($file_path, $filename_ext, $headers);
	}
}

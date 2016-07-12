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
use Log;

class MediaController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to all methods in this controller
        // except for the authenticate method. We don't want to prevent
        // the user from retrieving their token if they don't already have it
        $this->middleware('jwt.auth', ['except' => ['systemImport', 'assignSystemImportedMediaToUser', 'getQRCode', 'getMedia', 'downloadMedia', 'downloadThumbnail', 'showUpload', 'processUpload', 'importFile']]);
    }

	/**
	 * Run this only after running "php artisan migrate:refresh --seed" -- import all old content to the new system.
	 */
	public function systemImport()
	{
		$old_media = DB::select('select * from spherecast_viewer.photospheres');
		$root_import_path = \Config::get('custom.imported_path');
		$site_id = 1;
//		$omit_ips = ['90.77.232.224'];
		$omit_ips = [];

		foreach ($old_media as $m)
		{
			if (in_array($m->ip, $omit_ips))
				continue;

			// If the code is already in the system, just skip it.
			$check_media = Media::where('code', $m->code)->first();
			if ($check_media)
				continue;

			$filepath = $root_import_path . '/' . $m->filepath;

			if (file_exists($filepath))
				$filesize = filesize($filepath);

			if ($filesize < 15000)
				continue;

			$hash = hash_file('sha256', $filepath);
			$copy_filename = $hash . '_' . $filesize;
			$copy_file = Config::get('custom.upload_path') . '/' . $copy_filename . '.jpg';

			// If the file already exists, retrieve the file record.
			$do_copy_file = true;
			if (file_exists($copy_file))
			{
				$do_copy_file = false;

				$file_item = FileItem::where('stored_filename', $copy_filename)->first();
				if (!$file_item)
				{
					// No file record? Weird, but whatever. let's just move the file normally.
					$do_copy_file = true;
				}
			}

			// Copy the file, and create the file record.
			if ($do_copy_file == true)
			{
				copy($filepath, $copy_file);

				// Create a new file record.
				$file_item = new FileItem;
				$file_item->stored_filename = $copy_filename;
				$file_item->stored_extension = 'jpg';
				$file_item->mimetype = 'image/jpeg';
				$file_item->filesize = $filesize;
				$file_item->ip = $m->ip;
				$file_item->save();
			}

			// Create the media record, and link it to the file.
			$exif_data = json_decode($m->exif_data);
			if (isset($exif_data->FileName))
				$original_filename = $exif_data->FileName;
			else
				$original_filename = str_replace('/files/', '', $m->filepath);

			$media = new Media;
			$media->code = $m->code;
			$media->site_id = $site_id;
			$media->user_id = 0;
			$media->original_filename = $original_filename;
			$media->original_extension = 'jpg';
			$media->ip = $m->ip;
			$media->source = 'systemimport';
			$media->created_at = date('Y-m-d H:i:s', $m->timeuploaded);
			$media->updated_at = date('Y-m-d H:i:s', $m->timeuploaded);
			$media->save();

			$media_file = new MediaFile;
			$media_file->media_id = $media->id;
			$media_file->file_id = $file_item->id;
			$media_file->position = 0;
			$media_file->save();

//			$media = Media::where('media.id', $media->id)->first();
		}
	}

	/**
	 * Retrieve a list of uploads based on IP address.
	 */
	public function getSystemImportedMedia($limit = 24)
	{
		$site = Site::current();
		if ($site->id != 1)
			return response()->json(['error_general' => 'No uploads associated with this site.'], 401);

		$ip = \Request::getClientIp(true);
		$media = Media::where('site_id', $site->id)
						->where('source', 'systemimport')
						->where('user_id', 0)
						->where('ip', $ip)
						->limit($limit)
						->orderBy('created_at', 'desc')
						->get();
		$media_count = Media::where('site_id', $site->id)
						->where('source', 'systemimport')
						->where('user_id', 0)
						->where('ip', $ip)
						->limit($limit)
						->orderBy('created_at', 'desc')
						->count();
		return ['media' => $media, 'media_shown' => $limit, 'media_count' => $media_count];
	}

	/**
	 * Assign all media associated with a user's IP address to them.
	 */
	public function assignSystemImportedMediaToUser($media_id = null)
	{
		$site = Site::current();
		if ($site->id != 1)
			return response()->json(['error_general' => 'Could not retrieve site.'], 401);

		$user = $this->getUser();
		if (!$user || !is_numeric($user->id) || $user->id <= 0)
			return response()->json(['error_general' => 'Could not retrieve user.'], 401);

		$ip = \Request::getClientIp(true);
		$media = Media::where('site_id', $site->id)
						->where('source', 'systemimport')
						->where('user_id', 0)
						->where('ip', $ip)
						->get();

		$assign_count = 0;
		foreach ($media as $m)
		{
			$m->user_id = $user->id;
			if ($m->save())
				$assign_count++;
		}
		return ['message_general' => $assign_count . ' images were imported into your account.'];
	}

	/**
	 * Generate a QR code for a media URL.
	 */
	public function getQRCode($media_code)
	{
		// Make sure we're on the right site, and the media code is legitimate.
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not retrieve site.'], 401);

		$media = Media::where('code', $media_code)
						->where('site_id', $site->id)
						->first();
		if (!$media)
			return;

		$url = $site->url . '/' . $media->code;
		$qrcode = QrCode::format('png')->size(160)->margin(0)->generate($url);
		$headers = [
			'Content-Type' => 'image/png',
			'Content-Disposition' => 'attachment; filename="qr_' . $media_code . '.png"'
		];
		return \Response::make($qrcode, '200', $headers);
	}

	/**
	 * Retrive the authenticated user.
	 */
	public function getUser()
	{
		try
		{
			$token = JWTAuth::getToken();
			if ($token)
			{
				if ($user = JWTAuth::parseToken()->authenticate())
					return $user;
			}
		}
		catch (Tymon\JWTAuth\Exceptions\TokenExpiredException $e)
		{
		}
		return null;
	}

	/**
	 * Retrieve the authenticated user from the token.
	 */
	public function getAuthenticatedUserDetails()
	{
	    try {
	
			$token = JWTAuth::parseToken();
	        if (! $user = $token->authenticate()) {
	            return response()->json(['user_not_found'], 404);
	        }
	
	    } catch (Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
	
	        return response()->json(['token_expired'], $e->getStatusCode());
	
	    } catch (Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
	
	        return response()->json(['token_invalid'], $e->getStatusCode());
	
	    } catch (Tymon\JWTAuth\Exceptions\JWTException $e) {
	
	        return response()->json(['token_absent'], $e->getStatusCode());
	
	    }
	
	    // the token is valid and we have found the user via the sub claim
	    return response()->json(compact('user'));
	}

	/**
	 * Return a specific media object. Don't return anything if the site isn't correct.
	 *
	 * @param int $id
	 */
	public function getMedia($code)
	{
		$site = Site::current();
		if ($site)
		{
			$media = Media::where('code', $code)->where('site_id', $site->id)->first();
			return $media;
		}
		return;
	}

	/**
	 * Return the media for the current site.
	 *
	 * @param int $limit
	 * @param int $skip
	 */
	public function getMediaForSite($limit = 60, $skip = 0, $force_only_show_current_user = false)
	{
		$media = [];

		// Retrieve the site.
		// TODO: Move this into a filter and make sure it's saved in the session, so we don't have to keep
		// re-querying it?
		$site = Site::current();
		if ($site && ($site->shared == false || $force_only_show_current_user == true))
		{
			// The site is not in "shared" mode, so only show the user's own uploads.
			$user = $this->getUser();
			if (isset($user) && isset($user->id))
			{
				$media = Media::where('site_id', $site->id)
							->where('media.user_id', $user->id)
							->limit($limit)
							->skip($skip)
							->orderBy('created_at', 'desc')
							->get();
			}
		}
		else if ($site && $site->shared == true && $force_only_show_current_user == false)
		{
			// The site is in "public" mode, so show all uploads for the site.	
			$media = Media::where('site_id', $site->id)
						->limit($limit)
						->skip($skip)
						->orderBy('created_at', 'desc')
						->get();
		}
		return $media;
	}

	/**
	 * In most cases, the site will be the "local" site. Depending on the site's settings, the user may
	 * either see just their content, or everyone's content.
	 *
	 * @param int $limit
	 * @param int $skip
	 */
	public function showMediaGrid($limit = 50, $skip = 0)
	{
		$media = [];

		// Retrieve the site.
		// TODO: Move this into a filter and make sure it's saved in the session, so we don't have to keep
		// re-querying it?
		$site = Site::current();
		if ($site && $site->shared == false)
		{
			// The site is not in "shared" mode, so only show the user's own uploads.
			$user = \Session::get('login_user');
			if (isset($user) && isset($user->id))
			{
				$media = Media::where('site_id', $site->id)
							->where('media.user_id', $user->id)
							->limit($limit)
							->skip($skip)
							->orderBy('created_at', 'desc')
							->get();
			}
		}
		else if ($site && $site->shared == true)
		{
			// The site is in "shared" mode, so show all uploads for the site.	
			$media = Media::where('site_id', $site->id)
						->limit($limit)
						->skip($skip)
						->orderBy('created_at', 'desc')
						->get();
		}
		return \Response::view('list', ['media' => $media]);
	}

	/**
	 * Display upload page.
	 */
	public function showUpload()
	{
		return view('upload');
	}

	/**
	 * Import image from URL.
	 * TODO: Allow a "url" parameter to be manually specified to retrieve the file, but not on the "free" subscription.
	 */
	public function importFile($url = null)
	{
		$temp_files = [];

		// Make sure we have a site.
		$site = Site::current();
		if (!$site)
			return null;

		// Make sure we have a user. Set $userId to 0 if anonymous.
		$user = $this->getUser();
		if ($user)
			$user_id = $user->id;
		else
			$user_id = 0;

		if ($url == null)
			$url = \Input::get('url');

		if ($url != null && $url != '')
		{
			$url_path = parse_url($url, PHP_URL_PATH);

			// If there's no path, create a filename based on the date and time.
			if (!$url_path)
				$url_filename = date('Ymd') . '_' . date('Hi') . '_' . uniqid();
			else
				$url_filename = pathinfo($url_path, PATHINFO_FILENAME);
			$url_extension = pathinfo($url_path, PATHINFO_EXTENSION);
			$extensions = ['jpg', 'jpeg', 'png'];

			// TODO: Use cURL to grab just the headers of the URL first, to determine the Content-Type.
			// Either this, or download the file and use exif_imagetype().
			$temp_filename = 'tmp_' . uniqid() . '_' . date('YmdHis');
			if ($url_extension && in_array(strtolower($url_extension), $extensions))
				$temp_extension = $url_extension;
			else
				$temp_extension = 'jpg';	// Note: This might not be a JPEG, but we're just naming it this anyway.
			$temp_file = \Config::get('custom.tmp_path') . '/' . $temp_filename . '.' . $temp_extension;
			$temp_files[] = $temp_file;

			try
			{
				$fp = fopen($temp_file, 'w+');
				$ch = curl_init(str_replace(' ', '%20', $url));
				curl_setopt($ch, CURLOPT_TIMEOUT, 60);
				curl_setopt($ch, CURLOPT_FILE, $fp);
				curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
				curl_exec($ch);
				curl_close($ch);
				fclose($fp);
			}
			catch (Exception $e)
			{
				$this->cleanTempFiles($temp_files);
				$errors['message'] = 'File could not be downloaded from URL.';
				return $errors;
			}

			if (!file_exists($temp_file) || filesize($temp_file) == 0)
			{
				$this->cleanTempFiles($temp_files);
				$errors['message'] = 'File could not be retrieved from URL.';
				return $errors;
			}

			$imagetype = exif_imagetype($temp_file);
			if (!$imagetype)
			{
				$this->cleanTempFiles($temp_files);
				$errors['nessage'] = 'Not a valid image.';
				return $errors;
			}
			else
			{
				// Convert the file.
				$file_item = $this->convertFile($temp_file);
				if ($file_item !== null)
				{
					// Create a short code for the media item, checking that the code isn't already being used.
					$code = '';
					$chars = 'abcdefghijklmnopqrstuvwxyz1234567890';

					do
					{
						$media = null;
						for ($i = 0; $i < 5; $i++)
						{
							$code .= $chars[rand(0, strlen($chars) - 1)];
						}
						$media = Media::where('code', $code)->first();
					}
					while ($media !== null);

					// Create the media record, and link it to the file.
					$media = new Media;
					$media->code = $code;
					$media->site_id = $site->id;
					$media->user_id = $user_id;
					$media->original_filename = $url_filename;
					$media->original_extension = $url_extension;
					$media->ip = \Request::getClientIp(true);
					$media->save();

					if (isset($media->id))
					{
						$media_file = new MediaFile;
						$media_file->media_id = $media->id;
						$media_file->file_id = $file_item->id;
						$media_file->position = 0;
						$media_file->save();

						$media = Media::where('media.id', $media->id)->first();

						$this->cleanTempFiles($temp_files);
						return $media;
					}
				}
			}
		}
		$this->cleanTempFiles($temp_files);
		return null;
	}

	/**
	 * Upload files and initiate conversion process.
	 */
	public function processUpload()
	{
		$file = \Input::file('mediaFile');
		$errors = [];
		if (!$file)
		{
			$errors['message'] = 'File not found.';
			return $errors;
		}

		// Make sure we have a site.
		$site = Site::current();
		if (!$site)
			return null;

		// Make sure we have a user. Set $userId to 0 if anonymous.
		$user = $this->getUser();
		if ($user)
			$user_id = $user->id;
		else
			$user_id = 0;

		// Check if the file is a JPEG or PNG.
		if ($file->getMimeType() != 'image/jpeg' && $file->getMimeType() != 'image/png')
		{
			$errors['message'] = 'Not a valid JPEG or PNG.';
			return $errors;
		}
		else
		{
			// Extract the tags.
//			$tags = $this->extractTags(\Input::get('tags'));

			// Create a unique name for the file.
			$temp_filename = 'tmp_' . uniqid() . '_' . date('YmdHis');
			$temp_extension = 'jpg';
			$temp_file = \Config::get('custom.tmp_path') . '/' . $temp_filename . '.' . $temp_extension;
			if (!$file->move(\Config::get('custom.tmp_path'), $temp_filename . '.' . $temp_extension))
			{
				$errors['message'] = 'Could not save file.';
			}
			else
			{
				// Convert the file.
				$file_item = $this->convertFile($temp_file);
				if ($file_item !== null)
				{
					// Create a short code for the media item, checking that the code isn't already being used.
					$code = '';
					$chars = 'abcdefghijklmnopqrstuvwxyz1234567890';

					do
					{
						$media = null;
						for ($i = 0; $i < 5; $i++)
						{
							$code .= $chars[rand(0, strlen($chars) - 1)];
						}
						$media = Media::where('code', $code)->first();
					}
					while ($media !== null);

					// Create the media record, and link it to the file.
					$media = new Media;
					$media->code = $code;
					$media->site_id = $site->id;
					$media->user_id = $user_id;
					$media->original_filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
					$media->original_extension = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);
					$media->ip = \Request::getClientIp(true);
					$media->save();

					if (isset($media->id))
					{
						$media_file = new MediaFile;
						$media_file->media_id = $media->id;
						$media_file->file_id = $file_item->id;
						$media_file->position = 0;
						$media_file->save();

						$media = Media::where('media.id', $media->id)->first();
						return $media;
//						return \Redirect::to('/' . $media->code);
//						header('location: http://manage.sphcst.com/api/' . $media->code);
					}
				}
			}
		}
//		return \Redirect::to('/upload');
		return;
	}

	/**
	 * Convert the file.
	 */
	protected function convertFile($temp_file)
	{
		// Track all the temporary files, so we can delete them when we're done.
		$temp_files = [$temp_file];

		// If the width is more than 3000px, resize it to a width of 3000px.
		$size = getimagesize($temp_file);

		$max_width = 3000;
		$max_height = 3000;

		if ($size[0] > $max_width || filesize($temp_file) > 1000000)
		{
			$ratio = $size[0] / $size[1]; // width/height
			if ($ratio > 1)
			{
				$width = $max_width;
				$height = $max_height / $ratio;
			}
			else
			{
				$width = $max_width * $ratio;
				$height = $max_height;
			}

			// If the height is slightly off the 2:1 aspect ratio, just make it equal.
			if (($width / 2) >= ($height - 5) && ($width / 2) <= ($height + 5))
				$height = $width / 2;

			// Save the new file.
			if (null !== \Config::get('custom.memory_limit_mb'))
				$memory_limit_str = '-limit memory ' . \Config::get('custom.memory_limit_mb') . 'MiB -limit map ' . \Config::get('custom.memory_limit_mb') . 'MiB ';
			else
				$memory_limit_str = '';

			$new_filename = 'resize_' . uniqid() . '_' . date('YmdHis');
			$new_file = \Config::get('custom.tmp_path') . '/' . $new_filename . '.jpg';
			$temp_files[] = $new_file;

			$cmd = 'convert ' . $memory_limit_str . ' "' . $temp_file . '" -resize ' . $width . 'x' . $height . ' "' . $new_file . '"';
			exec($cmd);

			if (!file_exists($new_file))
			{
				// Delete all temporary files.
				$this->cleanTempFiles($temp_files);
//				echo 'FILE DID NOT WORK';

				return null;
			}
			$temp_file = $new_file;
		}

		// Make sure the height is padded to width / 2.
		$size = getimagesize($temp_file);
		if ($size[1] != $size[0] / 2)
		{
			$new_width = $size[0];
			$new_height = $size[0] / 2;
			$img = getimagesize($temp_file);
			$width = $size[0];
			$height = $size[1];

			if (null !== \Config::get('custom.memory_limit_mb'))
				$memory_limit_str = '-limit memory ' . \Config::get('custom.memory_limit_mb') . 'MiB -limit map ' . \Config::get('custom.memory_limit_mb') . 'MiB ';
			else
				$memory_limit_str = '';

			// Create the blank canvas.
			$new_file_canvas = \Config::get('custom.tmp_path') . '/canvas_' . uniqid() . '_' . date('YmdHis') . '.jpg';
			$temp_files[] = $new_file_canvas;

			$cmd = 'convert ' . $memory_limit_str . ' -size ' . $new_width . 'x' . $new_height . ' xc:black "' . $new_file_canvas . '"';
			exec($cmd);

			// Merge the image and canvas.
			$new_file_padded = \Config::get('custom.tmp_path') . '/padded_' . uniqid() . '_' . date('YmdHis') . '.jpg';
			$cmd = 'composite -gravity center "' . $temp_file . '" "' . $new_file_canvas . '" "' . $new_file_padded . '"';
			exec($cmd);

			if (!file_exists($new_file_padded))
			{
				return null;
			}
			$temp_file = $new_file_padded;
		}

		// Rename the file given the hash. If a file with this hash already exists, with the same filesize,
		// we'll just be linking the same image and can discard the image we've just created.

		// Make sure a file was actually created successfully after all this.
		if (file_exists($temp_file))
		{
			$filesize = filesize($temp_file);
			if (is_numeric($filesize))
			{
				$hash = hash_file('sha256', $temp_file);
				$move_filename = $hash . '_' . $filesize;
				$move_file = \Config::get('custom.upload_path') . '/' . $move_filename . '.jpg';

				// Check if the file with the same hash already exists.
				if (file_exists($move_file))
				{
					// File already exists, so retrieve the file record.
					$file_item = FileItem::where('stored_filename', $move_filename)->first();

					if (!$file_item)
					{
						// No file record? Weird, but whatever. let's just move the file normally.
					}
					else
					{
						// Delete all temporary files.
						$this->cleanTempFiles($temp_files);

						// Return the file record.
						return $file_item;
					}
				}

				// Move the file.
				if (!rename($temp_file, $move_file))
				{
					// TODO: Error-handle.
				}
				else
				{
					// Check that we don't have the file record already. This might have
					// happened if the files themselves were deleted, with records left
					// in the files table. If the record already exists, we shouldn't do
					// anything, just retrieve it.
					$file_item = FileItem::where('stored_filename', $move_filename)->first();
					if (!$file_item)
					{
						// Create a new file record.
						$file_item = new FileItem;
						$file_item->stored_filename = $move_filename;
						$file_item->stored_extension = 'jpg';
						$file_item->mimetype = 'image/jpeg';
						$file_item->filesize = $filesize;
						$file_item->ip = \Request::getClientIp(true);
						$file_item->save();
					}

					// Delete all temporary files.
					$this->cleanTempFiles($temp_files);

					return $file_item;
				}
			}
		}

		// Delete all temporary files.
		$this->cleanTempFiles($temp_files);

		return null;
	}

	/**
	 * Download a thumbnail, creating it if necessary. Note that we're using $media_id instead
	 * of $file_id, since this process should combine all the files associated with a media item.
	 * For now, since we only have one file per media item, it will be a simple process.
	 */
	public function downloadThumbnail($code, $width = null, $height = null)
	{
		// If the $code ends in ".jpg", remove it.
		if (substr($code, -4) == '.jpg')
			$code = substr($code, 0, -4);

		// Make sure the media item exists.
		$media = Media::where('code', $code)->first();
		if ($media)
		{
			// If a $width is not specified, use default specified in config.
			if ($width == null)
				$width = \Config::get('custom.thumb_default_width');

			// If a $height is not specified, use divisor on $width specified in config.
			if ($height == null)
				$height = (int) ($width / (\Config::get('custom.thumb_height_divisor')));

			if (is_numeric($width) && is_numeric($height) && $width > 0 && $height > 0)
			{
				// Check if the thumbnail record exists.
				$thumb = Thumb::where('media_id', $media->id)->where('width', $width)->where('height', $height)->first();
				if ($thumb)
				{
					// Make sure the file actually exists. If it doesn't, we'll need to fix this by deleting the
					// thumbnail record and creating a new one with a new thumbnail file.
					if (!file_exists(\Config::get('custom.thumb_path') . '/' . $thumb->stored_filename . '.' . $thumb->stored_extension))
					{
						$thumb->delete();
						$thumb = $this->processThumbnail($media->id, $width, $height);
					}
					else
					{
					}
				}
				else
				{
					// We don't have a thumbnail, so let's create one.
					$thumb = $this->processThumbnail($media->id, $width, $height);
				}

				// Display the thumbnail.
				if ($thumb)
				{
					$filename_ext = $thumb->stored_filename . '.' . $thumb->stored_extension;
					$file_path = \Config::get('custom.thumb_path') . '/' . $filename_ext;
					if (file_exists($file_path))
					{
						$headers = [
							'Content-Type: ' . isset($thumb->mimetype) ? $thumb->mimetype : 'image/jpeg'
						];
						return \Response::download($file_path, $filename_ext, $headers);
					}
				}
			}
		}
		return null;
	}

	/**
	 * Create a thumbnail from a file.
	 */
	protected function processThumbnail($media_id, $width, $height)
	{
		$temp_files = [];

		// Just retrieve the first file belonging to the media item.
		// TODO: If there are more than 1 file for a media, combine them all and make a thumbnail.
		// TODO: Properly eager-load the media with the files.
		$media_file = MediaFile::where('media_id', $media_id)->first();
		if ($media_file)
		{
			$file_item = FileItem::where('id', $media_file->file_id)->first();
			if ($file_item)
			{
				// TODO: Fix $file_item->file_exists() and $file_item->file_exists().
				$file_path = \Config::get('custom.upload_path') . '/' . $file_item->stored_filename . '.' . $file_item->stored_extension;
				if (!file_exists($file_path))
					return null;

				$temp_filename = uniqid();
				$temp_extension = 'jpg';
				$temp_file = \Config::get('custom.tmp_path') . '/' . $temp_filename . '.' . $temp_extension;
				$temp_files[] = $temp_file;

				$cmd = 'convert ' . escapeshellarg($file_path) . ' -resize ' . $width . 'x' . $height . '\! ' . escapeshellarg($temp_file);
				exec($cmd);
				if (!file_exists($temp_file))
				{
					$this->cleanTempFiles($temp_files);
					return null;
				}
				else
				{
					// Hash and rename the file.
					$filesize = filesize($temp_file);
					if (is_numeric($filesize) && $filesize > 0)
					{
						$hash = hash_file('sha256', $temp_file);
						$move_filename = $hash . '_' . $filesize;
						$move_extension = 'jpg';
						$move_file = \Config::get('custom.thumb_path') . '/' . $move_filename . '.' . $move_extension;
						if (rename($temp_file, $move_file))
						{
							// Create the thumb record.
							$thumb = new Thumb;
							$thumb->media_id = $media_id;
							$thumb->stored_filename = $move_filename;
							$thumb->stored_extension = $move_extension;
							$thumb->width = $width;
							$thumb->height = $height;
							$thumb->save();

							return $thumb;
						}
					}
				}
			}
		}
		return null;
	}

	protected function cleanTempFiles($temp_files)
	{
		foreach ($temp_files as $tf)
		{
			if (file_exists($tf))
				unlink($tf);
		}

	}

	/**
	 * Send the JPEG(s) for the media. Note that we're using $media_id instead of $file_id.
	 * This process should return an array of all the files associated with the media item.
	 * For now, there is only one file per media item, but this will have to be updated
	 * later when we have multiple images per photosphere for HD scenes.
	 *
	 * @param string $stored_filename
	 */
	public function downloadMedia($code)
	{
		// Make sure the media item exists.
/*
		$media = \DB::table('media')
				->leftJoin('media_files', 'media.id', '=', 'media_files.media_id')
				->leftJoin('files', 'media_files.file_id', '=', 'files.id')
				->leftJoin('thumbs', 'thumbs.media_id', '=', 'thumbs.media_id')
				->select('media.*', 'media_files.*', 'files.*', 'thumbs')
				->where('media.code', $code)
				->first();
*/
		$site = Site::current();
		$media = Media::where('site_id', $site->id)->where('code', $code)->first();
		if ($media)
		{
			$media_file = MediaFile::where('media_id', $media->id)->where('position', 0)->first();
			if ($media_file)
			{
				// Make sure the file exists.
				$file_item = FileItem::where('id', $media_file->file_id)->first();
				if ($file_item)
				{
					$filename_ext = $file_item->stored_filename . '.' . $file_item->stored_extension;
					$file_path = \Config::get('custom.upload_path') . '/' . $filename_ext;
					if (file_exists($file_path))
					{
						$headers = [
							'Content-Type: image/jpeg',
//							'Content-Disposition: inline; ' . $filename_ext
						];
						return \Response::download($file_path, $filename_ext, $headers);
//						return \Response::make(file_get_contents($file_path), 200, $headers);
					}
				}
			}
		}
	}

	public function viewMedia($code)
	{
		$site = Site::current();
		$media = Media::where('site_id', $site->id)->where('code', $code)->first();
		if ($media)
			return \Response::view('viewer', ['media' => $media]);
	}

	/**
	 * Retrieve the media for a given IP address. This can give users a preview of the media associated
	 * with a certain IP address, which later importMediaByIP() can assign to their accounts.
	 */
	public function getMediaByIP($ip, $limit = 20)
	{
	}

	/**
	 * Create a media record and copy (not move) the file from the old sphcst.com uploads, and assign
	 * it to a specific site and user.
	 */
	public function importMediaFromOld($old_media_id, $site_id, $user_id)
	{
	}

	/**
	 * Update a media item.
	 */
	public function saveMedia(Request $request)
	{
		$site = Site::current();
		$user = User::get();

		$input = $request->all();
		if (!isset($input['id']) || !is_numeric($input['id']))
			return response()->json(['error_general' => 'Invalid media item.'], 401);
		$media_id = $input['id'];
		$title = isset($input['title']) ? trim($input['title']) : '';
		$code = isset($input['code']) ? trim(strtolower($input['code'])) : '';
		$tags = isset($input['tags']) ? $input['tags'] : '';

		$media = Media::where('id', $media_id)->first();

		// Make sure the user has permission to update this media item.
		if ($user->can('edit', $media_id))
		{
			if ($code == '')
				return response()->json(['error_code' => 'Shortname cannot be blank.'], 401);

			// Make sure the code isn't being used somewhere else.
			$check_code = Media::where('code', $code)
								->where('site_id', $site->id)
								->where('id', '!=', $media_id)
								->first();
			if ($check_code)
				return response()->json(['error_code' => 'This shortname is already in use.'], 401);

			// Make sure the user can edit titles.
			if ($user->can('edit_title', $media_id))
				$media->title = $title;

			if ($user->can('edit_code', $media_id))
				$media->code = $code;

			if ($user->can('edit_tags', $media_id))
//				$media->tags = $tags;

			$media->save();
			return response()->json(['message_general' => 'Media settings saved.'], 201);
		}
		else
			return response()->json(['error_general' => 'You are not allowed to save this media item.'], 401);
	}

	/**
	 * Delete a media item. Check if other media items point to it, so we don't remove the files record
	 * if we don't have to.
	 */
	public function deleteMedia($id)
	{
		$site = Site::current();
		$user = User::get();
		$media_id = $id;
//		$input = $request->only(['id']);
//		$input = $request->all();
		if (!isset($media_id) || !is_numeric($media_id))
			return response()->json(['error_general' => 'Invalid media item.'], 401);

		$title = isset($input['title']) ? trim($input['title']) : '';
		$code = isset($input['code']) ? trim(strtolower($input['code'])) : '';
		$tags = isset($input['tags']) ? $input['tags'] : '';

		// Make sure the user has permission to delete this media item.
		// Note that currently, those with "edit" permission also have "delete" permission.
		if ($user->can('delete', $media_id))
		{
			$media = Media::where('id', $media_id)->first();
			if ($media)
			{
				// Check if there are other media items on any site that refer to this file.
				$media_file = MediaFile::where('media_id', $media_id)->first();
				Log::info(print_r($media_file, true));
				if ($media_file)
				{
					// Use DB::transaction().
					$media->delete();
					$media_file = MediaFile::where('media_id', $media_id)->delete();
					$file = FileItem::where('id', $media_file->file_id)->first();
					$file->delete();	// The model will check if the file actually should be deleted.
				}
			}
		}
	}
}
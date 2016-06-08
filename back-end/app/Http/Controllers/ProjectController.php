<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Project;
use App\Scene;
use App\Media;
use App\MediaFile;
use App\FileItem;
use App\Site;

class ProjectController extends Controller
{
    public function __construct()
    {
        // Apply the jwt.auth middleware to the methods in this controller.
        $this->middleware('jwt.auth', ['except' => ['getMediaProject', 'getMediaProjectStatic']]);
    }

	public function getMediaProject($media_code)
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not determine site.'], 401);

		// Make sure the $media_code is valid.
		$media = Media::where('code', $media_code)
			->where('site_id', $site->id)
			->first();
		if (!$media)
			return response()->json(['error_general' => 'Invalid URL.'], 401);

		$project = new Project;
		$project->id = 1;
		$project->shortname = $media->code;
		$project->title = 'VR Photo Sphere Viewer - ' . $media->code;
		$project->startScene = 1;
		$project->defaultViewerMode = 'auto';
		$project->allowViewerModeStandard = 1;
		$project->allowViewerModeVR = 1;
		$project->enableSaveSession = 0;
		$project->requireLogin = 0;
		$project->defaultLanguage = 'en-en';
		$project->adjustFontSize = '+0';
		$project->showCrosshairs = 0;

		$scene = new Scene;
		$scene->id = 1;
		$scene->shortname = 'scene_' . $media->code;
		$scene->projectId = 1;
		$scene->sequence = 1;
		$scene->parent = 0;
		$scene->title = 'Scene 1: ' . $media->code;
		$scene->viewType = 'spherecast';
		$scene->showGroundPanel = 0;
		$scene->introScene = 0;

		$file = $media->file();

		$backgroundMedia = new \stdClass;
		$backgroundMedia->id = $media->id;
		$backgroundMedia->projectId = 1;
		$backgroundMedia->type = 'backgroundimage';
		$backgroundMedia->filename = $media->original_filename . '.' . $media->original_extension;
		$backgroundMedia->filepath = '/';
		$backgroundMedia->scaleX = '1.00';
		$backgroundMedia->scaleY = '1.00';
		$backgroundMedia->fileIdLow = $file->id;
		$backgroundMedia->fileIdMedium = $file->id;
		$backgroundMedia->fileIdHigh = $file->id;
		$backgroundMedia->fileIdUltra = $file->id;
		$backgroundMedia->fileIdUltra = $file->id;

		$scene->backgroundMediaId = $media->id;

		$file_item = new \stdClass;
		$file_item->id = $file->id;
		$file_item->contenthash = '';
		$file_item->filepath = '/api/media/' . $media->code;
		$file_item->title = $media->original_filename . '.' . $media->original_extension;
		$file_item->filename = $media->original_filename . '.' . $media->original_extension;
		$file_item->mimetype = $file->mimetype;
		$file_item->filesize = $file->filesize;
		$file_item->extension = $file->stored_extension;
		$backgroundMedia->files = [$file_item->id => $file_item];

		$project->assets = new \stdClass;
		$project->assets->priorities = [];
		$project->assets->media = [$backgroundMedia->id => $backgroundMedia];
		$project->scenes = [$scene->id => $scene];

		$project->startEvents = [];
		$project->endEvents = [];
		$project->hotspots = [];

		return $project;
	}

	public function getMediaProjectStatic($media_code)
	{
		$site = Site::current();
		if (!$site)
			return response()->json(['error_general' => 'Could not determine site.'], 401);

		$project = $this->getMediaProject($media_code);

		return response()->view('static.media', ['site' => $site, 'project' => $project]);
	}
}

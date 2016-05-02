<?php
// See http://culttt.com/2013/05/13/setting-up-your-first-laravel-4-model/
// We need to eagerly collect nested relations: Project -> Scene -> Event -> Action.
// See http://stackoverflow.com/questions/22701455/laravel-collection-eager-loading-based-on-nested-relation-field-value
// See http://stackoverflow.com/questions/22868362/laravel-4-1-eager-loading-nested-relationships-with-constraints
class Project extends Eloquent
{
	// protected $table = 'projects';				// Not necessary, since Laravel assumes a class named "Project" refers to the "projects" table.

	protected $id;
	protected $shortname;
	protected $title;
	protected $subtitle;
	protected $description;
	protected $createdBy;
	protected $timeCreated;
	protected $startScene;
	protected $scenes;
	protected $users;
	protected $tags;
	protected $globalVariables;
	protected $hotspotProfiles;

	protected $defaultViewerMode = 'auto';			// Options: auto, standard, vr, fixed (can't be moved around)
	protected $allowViewerModeStandard = true;
	protected $allowViewerModeVR = true;
//	protected $showTapToBeginScreen = true;			// This should always display on mobile devices.
//	protected $autoAdvancePrimaryVideoEnd = true;
//	protected $autoAdvancePrimaryAudioEnd = true;
	protected $enableSaveSession = true;			// Enable session tracking for logged-in users.
	protected $requireLogin = false;				// Require that users log in to view this project (for tracking progress).
	protected $defaultLanguage;
	protected $adjustFontSize;
	protected $showCrosshairs = true;
	protected $introMedia;
	protected $useCache = false;
	protected $cachedJSON;

	protected $guarded = array('id');

	public function scenes()
	{
		return $this->hasMany('Scene', 'projectId', 'id');
	}

	public function media()
	{
		return $this->hasMany('Media', 'projectId', 'id');
	}

	public function json()
	{
		return $this->hasOne('ProjectCache', 'projectId', 'id');
	}

	public function globalVariables()
	{
		return $this->hasMany('GlobalVariable', 'projectId', 'id');
	}
}
?>
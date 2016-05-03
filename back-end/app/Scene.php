<?php
/*
class yourModel extends Eloquent{
        public static function startEvents(){
                $this->hasMany('events', 'foreign_key', 'local_key');
        }       
}

now, in your controller or wherever:

$myStartEvents = yourModel::whereId(1)->startEvents();
 */
namespace App;

use Illuminate\Database\Eloquent\Model;

class Scene extends Model
{
	protected $id;
	protected $shortname;
	protected $projectId;
	protected $sequence;							// Used only for displaying in the editor.
	protected $parent;								// Not currently used, but could be used to establish a scene hierarchy.
	protected $title;
	protected $subtitle;
	protected $description;
	protected $viewType;							// Normally this is "spherecast" as in the default Spherecast viewer, but eventually this could be used to incorporate Google Street View or 3d viewers.
	protected $createdBy;
	protected $lockedBy;
	protected $timeLocked;
	protected $showGroundPanel;						// A nav panel at the user's feet (only on VR mode) that contains "Previous" and "Next" hotspots.
	protected $introScene;							// A boolean that indicates this is an "intro" scene, i.e. a replacement for the "Tap screen to begin" that appears on mobile devices.
	protected $backgroundMedia;						// A Media object.

//	protected $backgroundRepeat;					// Only used for videos.
//	protected $autoAdvancePrimaryVideoEnd;			// Overrides what's set in the defaults.
//	protected $autoAdvancePrimaryAudioEnd;			// Overrides what's set in the defaults.
//	protected $autoAdvanceDuration;					// If higher than zero, automatically advance the scene after that many seconds no matter what.

	protected $guarded = array('id');
	protected $table = 'scenes';
/*
	public function __construct($attributes = array())
	{
		parent::__construct($attributes);
		$this->events;
	}
*/
	public function project()
	{
		return $this->belongsTo('Project', 'projectId', 'id');
	}

	public function events()
	{
		return $this->hasMany('SceneEvent', 'sceneId', 'id');
	}

	public function startEvents()
	{
		return $this->hasMany('SceneEvent', 'sceneId', 'id')->startEvents();
	}

	public function endEvents()
	{
		return $this->hasMany('SceneEvent', 'sceneId', 'id')->endEvents();
	}

	public function voiceEvents()
	{
		return $this->hasMany('SceneEvent', 'sceneId', 'id')->voiceEvents();
	}

	public function hotspots()
	{
		return $this->hasMany('SceneEvent', 'sceneId', 'id')->hotspots();
//		return $this->hasManyThrough('Hotspot', 'SceneEvent', 'id', 'eventId');
	}
/*
	public function backgroundMedia()
	{
		return $this->morphMany('Media', 'mediable');
	}
*/
}
?>
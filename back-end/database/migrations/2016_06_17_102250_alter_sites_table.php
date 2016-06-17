<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AlterSitesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('site_title', 32)->nullable();
			$table->dropColumn('site_logo_media_small');
			$table->dropColumn('site_logo_media_large');
			$table->dropColumn('viewer_logo_media_small');
			$table->dropColumn('viewer_logo_media_large');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sites', function (Blueprint $table) {
        	$table->dropColumn('site_title');
			$table->integer('site_logo_media_small')->unsigned()->nullable();		// A media item for a small logo on the site. 
			$table->integer('site_logo_media_large')->unsigned()->nullable();		// A media item for a large logo on the site. 
			$table->integer('viewer_logo_media_small')->unsigned()->nullable();		// A media item for a small logo to show on the viewer.
			$table->integer('viewer_logo_media_large')->unsigned()->nullable();		// A media item for a large logo to show on the viewer.
        });
    }
}

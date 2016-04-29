<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSitesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sites', function (Blueprint $table)
        {
            $table->increments('id');
            $table->string('subdomain', 128);
            $table->string('domain', 128)->nullable();
            $table->string('title', 64)->nullable();
            $table->integer('created_by')->unsigned()->index();
            $table->boolean('shared')->default(true);				// If a site is shared, all users will see the same media when logged in. Otherwise, they only see their own media.
            $table->boolean('public_gallery')->default(false);		// The "Spheres" page shows in the menu and becomes the public gallery for users who aren't logged in. Normally it only shows to logged-in users.
			$table->boolean('allow_search')->default(true);			// Whether to allow searching.
            $table->boolean('allow_signups')->default(true);		// If signups aren't allowed, the "Login" page is inaccessible.
			$table->boolean('allow_uploads')->default(true);		// If uploads aren't allowed, the "Upload" page is inaccessible.
			$table->boolean('multi_file_upload')->default(true);	// Whether to allow multi-file upload. If false, single upload is only allowed.
			$table->boolean('url_import')->default(true);			// Whether to allow copy/pasting a URL to import instead of upload.
			$table->boolean('force_login')->default(true);			// If login is forced, the "Upload" page doesn't show in the menu without the user being logged in.
			$table->boolean('show_ads')->default(false);			// Whether to show ads.
			$table->boolean('show_qr_codes')->default(true);		// Whether to QR codes.
			$table->boolean('show_embeds')->default(true);			// Whether to show the embed link.
			$table->boolean('sso_google')->default(false);			// Allow Google single sign-on.
			$table->boolean('sso_facebook')->default(false);		// Allow Facebook single sign-on.
			$table->integer('site_logo_media_small')->unsigned()->nullable();		// A media item for a small logo on the site. 
			$table->integer('site_logo_media_large')->unsigned()->nullable();		// A media item for a large logo on the site. 
			$table->integer('viewer_logo_media_small')->unsigned()->nullable();		// A media item for a small logo to show on the viewer.
			$table->integer('viewer_logo_media_large')->unsigned()->nullable();		// A media item for a large logo to show on the viewer.
			
			// A short domain is an optional separate domains for short URLs. Example: the main site can be
			// photospheres.org, but the short URLs use sphcst.com. If a user tries to go to regular sphcst.com
			// in their browser without viewing a photosphere, it redirects to photospheres.org.
            $table->string('short_domain', 128)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
	{
        Schema::drop('sites');
    }
}

<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateRolesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('roles', function (Blueprint $table)
        {
			// Each role is unique to a site, and can be customized. When a new site is created,
			// default guest, user, and admin roles should be created.
			$table->increments('id');
			$table->integer('site_id')->unsigned()->index();
			$table->string('name', 64);								// A name to describe this role.
			$table->string('viewers')->default('spherecast,vrview');	// The photosphere viewers allowed.
			$table->integer('view_limit')->default(0)->unsigned();	// How many of the most recent photospheres they can view.
			$table->boolean('search')->default(true);				// Allow searching.
			$table->boolean('embed')->default(true);				// Allow embedding.
			$table->boolean('share')->default(true);				// Allow sharing.
			$table->boolean('qr_codes')->default(true);				// Allow QR codes.
			$table->boolean('edit_title')->default(true);			// Allow title editing.
			$table->boolean('edit_description')->default(true);		// Allow description editing.
			$table->boolean('edit_tags')->default(true);			// Allow tag editing..
			$table->boolean('multi_file_upload')->default(true);	// Allow multi-file upload.
			$table->boolean('public_gallery')->default(false);		// Allow public gallery.
			$table->boolean('brand_viewer')->default(false);		// Allow branding the viewer.
			$table->boolean('brand_gallery')->default(false);		// Allow branding the gallery.
			$table->boolean('create_roles')->default(false);		// Allow custom roles.
			$table->boolean('manage_users')->default(0);			// Allow user management.
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
        Schema::drop('roles');
    }
}

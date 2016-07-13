<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersCapabilitiesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users_capabilities', function (Blueprint $table)
        {
			$table->integer('user_id')->unsigned()->index();
			$table->boolean('site_admin')->default(false);			// User is a site administrator.
			$table->integer('view_limit')->default(0)->unsigned();	// How many of the most recent photospheres they can view.
			$table->boolean('search')->default(false);				// Allow searching.
			$table->boolean('embed')->default(true);				// Allow embedding.
			$table->boolean('share')->default(true);				// Allow sharing.
			$table->boolean('qr_codes')->default(true);				// Allow QR codes.
			$table->boolean('edit_title')->default(false);			// Allow title editing.
			$table->boolean('edit_description')->default(false);	// Allow description editing.
			$table->boolean('edit_code')->default(false);			// Allow shortname/code editing.
			$table->boolean('edit_tags')->default(false);			// Allow tag editing.
			$table->boolean('multi_file_upload')->default(false);	// Allow multi-file upload.
			$table->boolean('public_gallery')->default(false);		// Allow turning the public gallery on/off.
			$table->boolean('brand_viewer')->default(false);		// Allow branding the viewer.
			$table->boolean('brand_gallery')->default(false);		// Allow branding the gallery.
			$table->boolean('create_roles')->default(false);		// Allow custom roles.
			$table->boolean('manage_users')->default(false);		// Allow user management.
            $table->timestamps();

			$table->primary(['user_id']);

			$table->foreign('user_id')
				->references('id')->on('users')
				->onDelete('cascade')
				->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('users_capabilities');
    }
}

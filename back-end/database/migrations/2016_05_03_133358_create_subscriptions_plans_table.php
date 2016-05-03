<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSubscriptionsPlansTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('subscriptions_plans', function (Blueprint $table) {
			$table->integer('subscription_id')->unsigned();
			$table->string('name')->unique();						// A name to describe this access level.
			$table->string('viewers')->default('spherecast,vrview');	// The photosphere viewers allowed.
			$table->integer('view_limit')->default(0)->unsigned();	// How many of the most recent photospheres they can view.
			$table->boolean('search')->default(true);				// Allow searching.
			$table->boolean('embed')->default(true);				// Allow embedding.
			$table->boolean('share')->default(true);				// Allow sharing.
			$table->boolean('qr_codes')->default(true);				// Allow QR codes.
			$table->boolean('subdomain')->default(false);			// Allow subdomain creation.
			$table->boolean('domain_mapping')->default(false);		// Allow domain mapping.
			$table->boolean('edit_title')->default(true);			// Allow title editing.
			$table->boolean('edit_description')->default(true);		// Allow description editing.
			$table->boolean('edit_tags')->default(true);			// Allow tag editing..
			$table->boolean('multi_file_upload')->default(true);	// Allow multi-file upload.
			$table->boolean('public_gallery')->default(false);		// Allow public gallery.
			$table->boolean('brand_viewer')->default(false);		// Allow branding the viewer.
			$table->boolean('brand_gallery')->default(false);		// Allow branding the gallery.
			$table->boolean('custom_roles')->default(false);		// Allow custom roles.
			$table->boolean('manage_users')->default(0);			// Allow user management.
			$table->boolean('user_limit')->default(0);				// How many users can be created.
			$table->boolean('show_ads')->default(false);			// Whether to show ads.
			$table->boolean('sso_google')->default(true);			// Allow Google single sign-on.
			$table->boolean('sso_facebook')->default(true);			// Allow Facebook single sign-on.
			$table->boolean('sso_oauth')->default(true);			// Allow custom OAuth single sign-on.
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
        Schema::drop('subscriptions_plans');
    }
}

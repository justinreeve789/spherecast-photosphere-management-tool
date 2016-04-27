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
            $table->boolean('shared')->default(true);	// If a site is shared, all users will see the same media. Otherwise, they only see their own media.
            $table->boolean('allow_signups')->default(true);
            $table->boolean('force_login')->default(true);
            $table->string('short_domain', 128)->nullable();	// This can be a separate domain for short URLs. Example: the main site can be photospheres.org, but the short URLs use sphcst.com. If a user tries to go to regular http://sphcst.com in their browser without viewing a photosphere, it redirects to photospheres.org.
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

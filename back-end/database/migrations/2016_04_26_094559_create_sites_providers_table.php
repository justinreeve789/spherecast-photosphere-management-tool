<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSitesProvidersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sites_providers', function (Blueprint $table) {
            $table->integer('site_id')->unsigned();
			$table->string('auth_provider', 32);
			$table->string('app_id', 128);
			$table->string('secret', 128);
			$table->boolean('enabled')->default(true);
            $table->timestamps();

			$table->primary(['site_id', 'auth_provider']);
			$table->index('auth_provider');

			$table->foreign('site_id')
				->references('id')->on('sites')
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
        Schema::drop('sites_providers');
    }
}
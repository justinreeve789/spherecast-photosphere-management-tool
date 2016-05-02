<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateProjectsTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('projects', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('shortname');
			$table->string('title');
			$table->string('subtitle')->nullable();
			$table->text('description')->nullable();
			$table->integer('createdBy')->default(0);
//			$table->timestamp('timeCreated')->nullable();
			$table->integer('startScene')->nullable();
			$table->string('defaultViewerMode')->default('auto');
			$table->boolean('allowViewerModeStandard')->default(true);
			$table->boolean('allowViewerModeVR')->default(true);
			$table->boolean('enableSaveSession')->default(true);
			$table->boolean('requireLogin')->default(false);
			$table->string('defaultLanguage')->default('en-en');
			$table->string('adjustFontSize')->default('+0');
			$table->boolean('useCache')->default(0);
			$table->boolean('showCrosshairs')->default(1);
			$table->integer('introMedia')->nullable();

			// Indexes.
			$table->unique('shortname');
			$table->index('createdBy');

			// created_at, updated_at DATETIME
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
		Schema::drop('projects');
	}
}

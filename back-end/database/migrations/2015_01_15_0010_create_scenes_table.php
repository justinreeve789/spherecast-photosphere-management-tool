<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateScenesTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('scenes', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('shortname');
			$table->integer('projectId');
			$table->integer('sequence')->default(0);
			$table->integer('parent')->default(0);
			$table->string('title')->nullable();
			$table->string('subtitle')->nullable();
			$table->text('description')->nullable();
			$table->string('viewType')->default('spherecast');			// Spherecast, googlestreetview, 3d.
			$table->integer('createdBy')->default(0);
			$table->integer('lockedBy')->default(0);
			$table->boolean('showGroundPanel')->default(false);
			$table->boolean('introScene')->default(false);				// Indicates this is an "intro" scene, i.e. a replacement for the "Tap screen to begin" that appears on mobile devices.
			$table->text('params')->nullable();							// Serialized parameters.

			// Indexes.
			$table->unique('shortname');
			$table->index('projectId');
			$table->index('createdBy');
			$table->index('lockedBy');

			// Foreign keys.
			$table->foreign('projectId')
				->references('id')->on('projects')
				->onDelete('cascade')
				->onUpdate('cascade');
			$table->foreign('backgroundMedia')
				->references('id')->on('media')
				->onDelete('set null')
				->onUpdate('cascade')

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
		Schema::drop('scenes');
	}

}

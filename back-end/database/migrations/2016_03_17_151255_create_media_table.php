<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateMediaTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
		Schema::create('media', function (Blueprint $table)
        {
            $table->increments('id');
            $table->integer('site_id')->default(0)->unsigned();
            $table->integer('user_id')->default(0)->unsigned();
            $table->string('code', 16);
            $table->string('title', 128)->nullable();
            $table->string('mode', 8)->default('auto');
            $table->string('original_filename', 256);
            $table->string('original_extension', 8);
            $table->string('ip', 64)->nullable();
			$table->string('viewer')->default('spherecast');	// This can be "spherecast" for the Spherecast viewer, or "vrview" for the viewer at https://github.com/google/vrview
            $table->boolean('visible')->default(true);
			$table->boolean('deleted')->default(false);
            $table->timestamps();
			$table->softDeletes();

			$table->unique(['site_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
		Schema::drop('media');
	}
}
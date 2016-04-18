<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateThumbsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('thumbs', function (Blueprint $table)
        {
            $table->increments('id');
			$table->integer('media_id')->unsigned();
			$table->string('stored_filename', 128);
			$table->string('stored_extension', 8);
            $table->string('mimetype', 128)->nullable();
			$table->integer('filesize')->unsigned()->default(0);
			$table->integer('width')->unsigned();
			$table->integer('height')->unsigned();
            $table->timestamps();

			$table->unique(['media_id', 'width', 'height']);
			$table->foreign('media_id')->references('id')->on('media')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('thumbs');
    }
}
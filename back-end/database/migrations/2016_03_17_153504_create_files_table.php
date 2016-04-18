<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
		Schema::create('files', function (Blueprint $table)
        {
            $table->increments('id');
            $table->string('stored_filename', 128);
            $table->string('stored_extension', 8);
            $table->string('mimetype', 128)->nullable();
            $table->integer('filesize')->unsigned()->default(0);
            $table->string('ip', 64)->nullable();
			$table->string('comments', 128)->nullable();
            $table->timestamps();

			$table->unique('stored_filename');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
		Schema::drop('files');
    }
}

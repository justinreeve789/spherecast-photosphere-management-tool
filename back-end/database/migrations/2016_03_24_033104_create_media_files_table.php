<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateMediaFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('media_files', function (Blueprint $table)
        {
        	$table->integer('media_id')->unsigned();
        	$table->integer('file_id')->unsigned();
            $table->integer('position')->unsigned()->default(0);
            $table->timestamps();

			$table->primary(['media_id', 'file_id']);
/*
			$table->foreign('media_id')
				->references('id')->on('media')
				->onDelete('cascade')
				->onUpdate('cascade');
			$table->foreign('file_id')
				->references('id')->on('files')
				->onDelete('cascade')
				->onUpdate('cascade');
 */
         });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('media_files');
    }
}

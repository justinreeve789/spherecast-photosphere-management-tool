<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateLogosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('logos', function (Blueprint $table)
        {
            $table->increments('id');
            $table->integer('site_id')->default(0)->unsigned();
			$table->integer('file_id')->unsigned();
            $table->string('type', 16);		// Can be site or viewer.
            $table->string('size', 16);		// Can be large, medium, or small.
			$table->string('original_filename', 256);
            $table->string('original_extension', 8);
            $table->timestamps();

			$table->unique(['site_id', 'type', 'size']);
			$table->foreign('site_id')->references('id')->on('sites')->onDelete('cascade');
			$table->foreign('file_id')->references('id')->on('files')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
		Schema::drop('logos');
    }
}

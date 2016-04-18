<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersSitesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users_sites', function (Blueprint $table)
        {
            $table->integer('site_id')->unsigned();
            $table->integer('user_id')->unsigned();
            $table->integer('access_id')->default(1)->unsigned()->index();
            $table->timestamps();

			$table->primary(['site_id', 'user_id']);

			$table->foreign('site_id')
				->references('id')->on('sites')
				->onDelete('cascade')
				->onUpdate('cascade');
			$table->foreign('user_id')
				->references('id')->on('users')
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
 		Schema::drop('users_sites');
	}
}

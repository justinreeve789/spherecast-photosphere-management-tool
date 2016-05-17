<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table)
        {
            $table->increments('id');
			$table->integer('site_id')->default(1)->unsigned()->index();
			$table->integer('role_id')->default(1)->unsigned()->index();
            $table->string('email', 255)->index();
            $table->string('password', 64);
            $table->string('name');
            $table->string('auth_provider', 32)->default('local');
            $table->text('auth_provider_id')->nullable();
            $table->tinyInteger('check_imports')->default(1);
            $table->rememberToken();
            $table->timestamps();

			$table->unique(['email', 'site_id', 'auth_provider']);

			$table->foreign('site_id')
				->references('id')->on('sites')
				->onDelete('cascade')
				->onUpdate('cascade');

			// TODO: Instead of using a site_id foreign key, run a script that checks
			// for orphaned user records and archives them.
/*
 			$table->foreign('site_id')
				->references('id')->on('sites')
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
        Schema::drop('users');
    }
}

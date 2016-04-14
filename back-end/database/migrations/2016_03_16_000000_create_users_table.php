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
            $table->string('email', 255);
            $table->string('password', 64);
            $table->string('name');
            $table->string('auth_provider', 32)->default('local');
            $table->text('auth_provider_id')->nullable();
            $table->rememberToken();
            $table->timestamps();

			$table->unique(['email', 'auth_provider']);
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

<?php

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use App\User;
use App\Site;
use App\UserSite;
use App\Access;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Model::unguard();

        DB::table('users')->delete();
		DB::table('sites')->delete();
		DB::table('access')->delete();

		$sites = array(
			['subdomain' => 'manage', 'domain' => 'sphcst.com', 'title' => 'Spherecast', 'shared' => 0],
			['subdomain' => 'vrdemo', 'domain' => 'sphcst.com', 'title' => 'VR Demo', 'shared' => 1],
			['subdomain' => '', 'domain' => 'avms.us', 'title' => 'AVMS', 'shared' => 1],
		);

		foreach ($sites as $site)
		{
			Site::create($site);
		}

        $users = array(
	        ['name' => 'Ryan Chenkie', 'email' => 'ryanchenkie@gmail.com', 'password' => Hash::make('secret')],
	        ['name' => 'Chris Sevilleja', 'email' => 'chris@scotch.io', 'password' => Hash::make('secret')],
	        ['name' => 'Holly Lloyd', 'email' => 'holly@scotch.io', 'password' => Hash::make('secret')],
	        ['name' => 'Adnan Kukic', 'email' => 'adnan@scotch.io', 'password' => Hash::make('secret')],
        );
            
        foreach ($users as $user)
        {
            $user = User::create($user);
			UserSite::create(['site_id' => 1, 'user_id' => $user->id, 'access_id' => 1]);
        }

		$accesses = array(
			['name' => 'free', 'view_limit' => 50, 'search' => 0, 'edit_title' => 0, 'edit_description' => 0, 'edit_tags' => 0, 'multi_file_upload' => 0],
			['name' => 'consumer'],
		);

		foreach ($accesses as $access)
		{
			Access::create($access);
		}
		
        Model::reguard();
    }
}

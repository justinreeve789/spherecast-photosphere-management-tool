<?php

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use App\User;
use App\Site;
use App\SiteProvider;
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
		DB::table('subscriptions_plans')->delete();

		$sites = array(
			['subdomain' => '', 'domain' => 'sphcst.com', 'title' => 'Spherecast Viewer', 'shared' => 0, 'force_login' => false, 'sso_google' => true, 'sso_facebook' => true],
			['subdomain' => 'manage', 'domain' => 'sphcst.com', 'title' => 'Spherecast', 'shared' => 0, 'force_login' => false, 'sso_google' => true, 'sso_facebook' => true],
			['subdomain' => '', 'domain' => 'photospheres.org', 'title' => 'Photospheres', 'shared' => 0, 'force_login' => false, 'sso_google' => true, 'sso_facebook' => true],
			['subdomain' => '', 'domain' => 'avms.us', 'title' => 'AVMS', 'shared' => 1],
		);

		foreach ($sites as $site)
		{
			Site::create($site);
		}

		$sites_providers  = array(
			['site_id' => 1, 'auth_provider' => 'facebook', 'app_id' => '447635065516276', 'secret' => '3f4f90f64731a3ad65568e57f780526a'],
			['site_id' => 3, 'auth_provider' => 'facebook', 'app_id' => '990909701004112', 'secret' => '9cb31c7ea4595338197e5b0dd7a0fbfb'],
			['site_id' => 3, 'auth_provider' => 'google', 'app_id' => '829633846470-krlc118s6ul18u8s9vovrn6h4pt2iuum.apps.googleusercontent.com', 'secret' => 'pjQXGzOqAYsoNt4oCfmjNWnM'],
		);

		foreach ($sites_providers as $sp)
		{
			SiteProvider::create($sp);
		}
/*
        $users = array(
	        ['name' => 'Ryan Chenkie', 'site_id' => 1, 'email' => 'ryanchenkie@gmail.com', 'password' => Hash::make('secret')],
	        ['name' => 'Chris Sevilleja', 'site_id' => 1, 'email' => 'chris@scotch.io', 'password' => Hash::make('secret')],
	        ['name' => 'Holly Lloyd', 'site_id' => 1, 'email' => 'holly@scotch.io', 'password' => Hash::make('secret')],
	        ['name' => 'Adnan Kukic', 'site_id' => 1, 'email' => 'adnan@scotch.io', 'password' => Hash::make('secret')],
        );

        foreach ($users as $user)
        {
            $user = User::create($user);
        }

		$subscriptions = array(
			['name' => 'free', 'view_limit' => 50, 'search' => 0, 'edit_title' => 0, 'edit_description' => 0, 'edit_tags' => 0, 'multi_file_upload' => 0],
			['name' => 'consumer'],
		);

		foreach ($subscriptions as $subscription)
		{
			Access::create($subscription);
		}
*/		
        Model::reguard();
    }
}

<?php

namespace App\Providers;

use App\Contracts\ProveedorFelInterface;
use App\Services\SimuladorFelService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            ProveedorFelInterface::class,
            SimuladorFelService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
<?php

namespace App\Providers;

use App\Contracts\ProveedorFelInterface;
use App\Contracts\ProveedorPagoInterface;
use App\Services\Fel\DigifactFelService;
use App\Services\Pagos\RecurrentePagoService;
use App\Services\Pagos\SimuladorPagoService;
use App\Services\Pagos\StripePagoService;
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
            match (
                config(
                    'services.fel.provider'
                )
            ) {
                'digifact' =>
                    DigifactFelService::class,

                default =>
                    SimuladorFelService::class,
            }
        );

        $this->app->bind(
            ProveedorPagoInterface::class,
            match (
                config(
                    'services.payments.provider'
                )
            ) {
                'stripe' =>
                    StripePagoService::class,

                'recurrente' =>
                    RecurrentePagoService::class,

                default =>
                    SimuladorPagoService::class,
            }
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
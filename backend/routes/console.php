<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command(
    'app:expirar-reservas'
)
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command(
    'app:expirar-compras-web'
)
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command(
    'app:actualizar-estados-funciones'
)
    ->everyMinute()
    ->withoutOverlapping();
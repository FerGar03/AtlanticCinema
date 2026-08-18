<?php

return [
    'horas_expiracion' => (int) env(
        'RESERVA_HORAS_EXPIRACION',
        2
    ),

    'minutos_antes_funcion' => (int) env(
        'RESERVA_MINUTOS_ANTES_FUNCION',
        30
    ),
];
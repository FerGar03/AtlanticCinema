<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración de CORS para Atlantic Cinema.
    |
    | El frontend autorizado se obtiene desde FRONTEND_URL.
    | En desarrollo:
    |
    | FRONTEND_URL=http://localhost:5173
    |
    | En producción se utilizará la URL definitiva de Vercel.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => [
        '*',
    ],

    'allowed_origins' => [
        rtrim(
            env(
                'FRONTEND_URL',
                'http://localhost:5173'
            ),
            '/'
        ),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        '*',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
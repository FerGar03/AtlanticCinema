<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'key' =>
            env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' =>
            env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' =>
            env('AWS_ACCESS_KEY_ID'),

        'secret' =>
            env('AWS_SECRET_ACCESS_KEY'),

        'region' =>
            env(
                'AWS_DEFAULT_REGION',
                'us-east-1'
            ),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' =>
                env(
                    'SLACK_BOT_USER_OAUTH_TOKEN'
                ),

            'channel' =>
                env(
                    'SLACK_BOT_USER_DEFAULT_CHANNEL'
                ),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Proveedor de pagos activo
    |--------------------------------------------------------------------------
    */

    'payments' => [
        'provider' =>
            env(
                'PAYMENT_PROVIDER',
                'simulator'
            ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Stripe
    |--------------------------------------------------------------------------
    */

    'stripe' => [
        'secret' =>
            env('STRIPE_SECRET'),

        'webhook_secret' =>
            env(
                'STRIPE_WEBHOOK_SECRET'
            ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google OAuth
    |--------------------------------------------------------------------------
    */

    'google' => [
        'client_id' =>
            env('GOOGLE_CLIENT_ID'),

        'client_secret' =>
            env(
                'GOOGLE_CLIENT_SECRET'
            ),

        'redirect' =>
            env(
                'GOOGLE_REDIRECT_URI'
            ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Recurrente
    |--------------------------------------------------------------------------
    */

    'recurrente' => [
        'secret_key' =>
            env(
                'RECURRENTE_SECRET_KEY'
            ),

        'api_url' =>
            env(
                'RECURRENTE_API_URL',
                'https://app.recurrente.com/api'
            ),

        'success_url' =>
            env(
                'RECURRENTE_SUCCESS_URL',
                'http://localhost:5173/pago-exitoso'
            ),

        'cancel_url' =>
            env(
                'RECURRENTE_CANCEL_URL',
                'http://localhost:5173/pago-cancelado'
            ),

        /*
         * Signing secret del endpoint webhook.
         * Formato: whsec_...
         */
        'webhook_secret' =>
            env(
                'RECURRENTE_WEBHOOK_SECRET'
            ),

        /*
         * Identificador del Sandbox actual.
         * Permite impedir que un webhook de otro
         * ambiente de prueba se procese aquí.
         */
        'sandbox_id' =>
            env(
                'RECURRENTE_SANDBOX_ID'
            ),
    ],

    /*
|--------------------------------------------------------------------------
| FEL
|--------------------------------------------------------------------------
*/

'fel' => [
    'provider' =>
        env(
            'FEL_PROVIDER',
            'simulator'
        ),
],

/*
|--------------------------------------------------------------------------
| Digifact FEL
|--------------------------------------------------------------------------
*/

'digifact' => [
    'environment' =>
        env(
            'DIGIFACT_ENVIRONMENT',
            'test'
        ),

    'api_url' =>
        env(
            'DIGIFACT_API_URL',
            'https://testnucgt.digifact.com/api'
        ),

    'tax_id' =>
        env(
            'DIGIFACT_TAX_ID'
        ),

    'username' =>
        env(
            'DIGIFACT_USERNAME'
        ),

    'password' =>
        env(
            'DIGIFACT_PASSWORD'
        ),

    'format' =>
        env(
            'DIGIFACT_FORMAT',
            'PDF|HTML|XML'
        ),

    /*
     * Datos fiscales del emisor.
     * Estos deben confirmarse con Digifact
     * antes de activar el proveedor real.
     */
    'issuer_name' =>
        env(
            'DIGIFACT_ISSUER_NAME'
        ),

    'vat_affiliation' =>
        env(
            'DIGIFACT_VAT_AFFILIATION',
            'GEN'
        ),

    'phrase_type' =>
        env(
            'DIGIFACT_PHRASE_TYPE',
            '1'
        ),

    'phrase_scenario' =>
        env(
            'DIGIFACT_PHRASE_SCENARIO',
            '1'
        ),

    'branch_code' =>
        env(
            'DIGIFACT_BRANCH_CODE',
            '1'
        ),

    'branch_name' =>
        env(
            'DIGIFACT_BRANCH_NAME'
        ),

    'address' =>
        env(
            'DIGIFACT_ADDRESS'
        ),

    'city_code' =>
        env(
            'DIGIFACT_CITY_CODE'
        ),

    'district' =>
        env(
            'DIGIFACT_DISTRICT'
        ),

    'state' =>
        env(
            'DIGIFACT_STATE'
        ),
    ],
];

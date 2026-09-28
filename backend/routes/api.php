<?php



use App\Http\Controllers\Api\AsientoController;

use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\ClasificacionController;

use App\Http\Controllers\Api\FacturaController;

use App\Http\Controllers\Api\FormatoController;

use App\Http\Controllers\Api\FuncionController;

use App\Http\Controllers\Api\GeneroController;

use App\Http\Controllers\Api\NotificacionController;

use App\Http\Controllers\Api\PagoController;

use App\Http\Controllers\Api\PeliculaController;

use App\Http\Controllers\Api\RecurrenteWebhookController;

use App\Http\Controllers\Api\ReporteController;

use App\Http\Controllers\Api\ReservaController;

use App\Http\Controllers\Api\RolController;

use App\Http\Controllers\Api\SalaController;

use App\Http\Controllers\Api\TicketController;

use App\Http\Controllers\Api\UsuarioController;

use App\Http\Controllers\Api\VentaController;

use Illuminate\Support\Facades\Route;



/*

|--------------------------------------------------------------------------

| Autenticación

|--------------------------------------------------------------------------

*/



Route::prefix('auth')->group(function (): void {

    Route::post('/registro', [

        AuthController::class,

        'registrar',

    ]);



    Route::post('/login', [

        AuthController::class,

        'iniciarSesion',

    ]);



    Route::get('/google', [

        AuthController::class,

        'redirigirAGoogle',

    ]);



    Route::get('/google/callback', [

        AuthController::class,

        'callbackGoogle',

    ]);



    Route::middleware(

        'auth:sanctum'

    )->group(

        function (): void {

            Route::get('/usuario', [

                AuthController::class,

                'usuarioAutenticado',

            ]);



            Route::patch('/perfil', [

                AuthController::class,

                'actualizarPerfil',

            ]);



            Route::post(

                '/perfil/avatar',

                [

                    AuthController::class,

                    'actualizarAvatar',

                ]

            );



            Route::patch('/password', [

                AuthController::class,

                'cambiarPassword',

            ]);



            Route::post('/logout', [

                AuthController::class,

                'cerrarSesion',

            ]);

        }

    );

});



/*

|--------------------------------------------------------------------------

| Usuarios y roles

|--------------------------------------------------------------------------

*/



Route::get('/roles', [

    RolController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.ver',

]);



Route::get('/usuarios', [

    UsuarioController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.ver',

]);



Route::post('/usuarios', [

    UsuarioController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.crear',

]);



Route::get('/usuarios/{usuario}', [

    UsuarioController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.ver',

])->whereNumber(

    'usuario'

);



Route::patch('/usuarios/{usuario}', [

    UsuarioController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.editar',

])->whereNumber(

    'usuario'

);



Route::delete('/usuarios/{usuario}', [

    UsuarioController::class,

    'destroy',

])->middleware([

    'auth:sanctum',

    'permiso:usuarios.eliminar',

])->whereNumber(

    'usuario'

);



/*

|--------------------------------------------------------------------------

| Catálogos

|--------------------------------------------------------------------------

*/



Route::get('/clasificaciones', [

    ClasificacionController::class,

    'index',

]);



Route::get('/generos', [

    GeneroController::class,

    'index',

]);



Route::get('/formatos', [

    FormatoController::class,

    'index',

]);



/*

|--------------------------------------------------------------------------

| Películas

|--------------------------------------------------------------------------

*/



Route::get('/peliculas', [

    PeliculaController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.ver',

]);



Route::post('/peliculas', [

    PeliculaController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.crear',

]);



Route::get('/peliculas/{pelicula}', [

    PeliculaController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.ver',

])->whereNumber(

    'pelicula'

);



Route::put('/peliculas/{pelicula}', [

    PeliculaController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.editar',

])->whereNumber(

    'pelicula'

);



Route::patch('/peliculas/{pelicula}', [

    PeliculaController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.editar',

])->whereNumber(

    'pelicula'

);



Route::delete('/peliculas/{pelicula}', [

    PeliculaController::class,

    'destroy',

])->middleware([

    'auth:sanctum',

    'permiso:peliculas.eliminar',

])->whereNumber(

    'pelicula'

);



/*

|--------------------------------------------------------------------------

| Salas y asientos

|--------------------------------------------------------------------------

*/



Route::get('/salas', [

    SalaController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:salas.ver',

]);



Route::post('/salas', [

    SalaController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:salas.crear',

]);



Route::get('/salas/{sala}', [

    SalaController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:salas.ver',

])->whereNumber(

    'sala'

);



Route::patch('/salas/{sala}', [

    SalaController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:salas.editar',

])->whereNumber(

    'sala'

);



Route::get(

    '/salas/{sala}/asientos',

    [

        AsientoController::class,

        'indexPorSala',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:salas.ver',

])->whereNumber(

    'sala'

);



Route::patch('/asientos/{asiento}', [

    AsientoController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:salas.editar',

])->whereNumber(

    'asiento'

);



/*

|--------------------------------------------------------------------------

| Funciones

|--------------------------------------------------------------------------

*/



Route::get('/funciones', [

    FuncionController::class,

    'index',

]);



Route::post('/funciones', [

    FuncionController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:funciones.crear',

]);



Route::post('/funciones/multiples', [

    FuncionController::class,

    'storeMultiples',

])->middleware([

    'auth:sanctum',

    'permiso:funciones.crear',

]);



Route::patch('/funciones/{funcion}', [

    FuncionController::class,

    'update',

])->middleware([

    'auth:sanctum',

    'permiso:funciones.editar',

])->whereNumber(

    'funcion'

);



Route::post(

    '/funciones/{funcion}/cancelar',

    [

        FuncionController::class,

        'cancelar',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:funciones.cancelar',

])->whereNumber(

    'funcion'

);



Route::get('/funciones/{funcion}', [

    FuncionController::class,

    'show',

])->whereNumber(

    'funcion'

);



/*

|--------------------------------------------------------------------------

| Reservas

|--------------------------------------------------------------------------

*/



Route::get('/reservas', [

    ReservaController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:reservas.ver',

]);



Route::post('/reservas', [

    ReservaController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:reservas.crear',

]);



Route::post(

    '/reservas/{reserva}/cancelar',

    [

        ReservaController::class,

        'cancelar',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:reservas.cancelar',

])->whereNumber(

    'reserva'

);



Route::get('/reservas/{reserva}', [

    ReservaController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:reservas.ver',

])->whereNumber(

    'reserva'

);



/*

|--------------------------------------------------------------------------

| Ventas

|--------------------------------------------------------------------------

*/



Route::get('/ventas', [

    VentaController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:ventas.ver',

]);



Route::post('/ventas/directa', [

    VentaController::class,

    'storeDirecta',

])->middleware([

    'auth:sanctum',

    'permiso:ventas.registrar',

]);



Route::post('/ventas/taquilla', [

    VentaController::class,

    'storeTaquilla',

])->middleware([

    'auth:sanctum',

    'permiso:ventas.registrar',

]);



Route::post(

    '/ventas/desde-reserva',

    [

        VentaController::class,

        'storeDesdeReserva',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:ventas.registrar',

]);



Route::patch(

    '/ventas/{venta}/facturacion',

    [

        VentaController::class,

        'actualizarFacturacion',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:ventas.registrar',

])->whereNumber(

    'venta'

);



Route::get('/ventas/{venta}', [

    VentaController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:ventas.ver',

])->whereNumber(

    'venta'

);



/*

|--------------------------------------------------------------------------

| Pagos

|--------------------------------------------------------------------------

*/



Route::get('/pagos', [

    PagoController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:pagos.ver',

]);



Route::post('/pagos', [

    PagoController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:pagos.registrar',

]);



Route::post('/pagos/taquilla', [

    PagoController::class,

    'storeTaquilla',

])->middleware([

    'auth:sanctum',

    'permiso:pagos.registrar',

]);


Route::post('/pagos/consultar-nit', [

    PagoController::class,

    'consultarNit',

])->middleware([

    'auth:sanctum',

    'permiso:pagos.registrar',

]);



Route::post(

    '/pagos/{pago}/confirmar-simulacion',

    [

        PagoController::class,

        'confirmarSimulacion',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:pagos.registrar',

])->whereNumber(

    'pago'

);



Route::get('/pagos/{pago}', [

    PagoController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:pagos.ver',

])->whereNumber(

    'pago'

);



/*

|--------------------------------------------------------------------------

| Facturas

|--------------------------------------------------------------------------

*/



Route::get('/facturas', [

    FacturaController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:facturas.ver',

]);



Route::post('/facturas', [

    FacturaController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:facturas.generar',

]);



Route::get(

    '/facturas/ventas-disponibles',

    [

        FacturaController::class,

        'ventasDisponibles',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:facturas.generar',

]);



Route::post(

    '/facturas/{factura}/reintentar',

    [

        FacturaController::class,

        'reintentar',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:facturas.generar',

])->whereNumber(

    'factura'

);



Route::get(

    '/facturas/{factura}/pdf',

    [

        FacturaController::class,

        'pdf',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:facturas.ver',

])->whereNumber(

    'factura'

);



Route::get(

    '/facturas/{factura}/xml',

    [

        FacturaController::class,

        'xml',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:facturas.ver',

])->whereNumber(

    'factura'

);



Route::get('/facturas/{factura}', [

    FacturaController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:facturas.ver',

])->whereNumber(

    'factura'

);



/*

|--------------------------------------------------------------------------

| Tickets

|--------------------------------------------------------------------------

*/



Route::get('/tickets', [

    TicketController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:tickets.ver',

]);



Route::post('/tickets', [

    TicketController::class,

    'store',

])->middleware([

    'auth:sanctum',

    'permiso:tickets.generar',

]);



Route::post('/tickets/validar', [

    TicketController::class,

    'validar',

])->middleware([

    'auth:sanctum',

    'permiso:tickets.validar',

]);



Route::get(

    '/tickets/ventas-disponibles',

    [

        TicketController::class,

        'ventasDisponibles',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:tickets.generar',

]);



Route::get(

    '/tickets/{ticket}/pdf',

    [

        TicketController::class,

        'pdf',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:tickets.ver',

])->whereNumber(

    'ticket'

);



Route::get('/tickets/{ticket}', [

    TicketController::class,

    'show',

])->middleware([

    'auth:sanctum',

    'permiso:tickets.ver',

])->whereNumber(

    'ticket'

);



/*

|--------------------------------------------------------------------------

| Notificaciones

|--------------------------------------------------------------------------

*/



Route::get('/notificaciones', [

    NotificacionController::class,

    'index',

])->middleware([

    'auth:sanctum',

    'permiso:notificaciones.ver',

]);



Route::post(

    '/notificaciones/procesar',

    [

        NotificacionController::class,

        'procesar',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:notificaciones.procesar',

]);



Route::get(

    '/notificaciones/{notificacion}',

    [

        NotificacionController::class,

        'show',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:notificaciones.ver',

])->whereNumber(

    'notificacion'

);



/*

|--------------------------------------------------------------------------

| Reportes

|--------------------------------------------------------------------------

*/



Route::get(

    '/reportes/resumen',

    [

        ReporteController::class,

        'resumen',

    ]

)->middleware([

    'auth:sanctum',

    'permiso:reportes.ver',

]);



/*

|--------------------------------------------------------------------------

| Webhooks

|--------------------------------------------------------------------------

*/



Route::post(

    '/webhooks/recurrente',

    [

        RecurrenteWebhookController::class,

        'handle',

    ]

);
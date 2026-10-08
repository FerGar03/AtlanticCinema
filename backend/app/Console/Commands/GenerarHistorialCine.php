<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class GenerarHistorialCine extends Command
{
    protected $signature = 'app:generar-historial-cine
        {--inicio= : Fecha del martes de la semana en formato YYYY-MM-DD}
        {--pelicula-a= : ID de la primera película}
        {--pelicula-b= : ID de la segunda película}
        {--correo-base= : Cuenta Gmail controlada para generar aliases}
        {--clientes=80 : Cantidad de clientes sintéticos a mantener}
        {--sala-a=Sala 1 : Sala utilizada por la película A}
        {--sala-b=Sala 2 : Sala utilizada por la película B}
        {--formato-a=2D : Formato de la película A}
        {--formato-b=2D : Formato de la película B}
        {--hora-a=18:00 : Hora de la función de la película A}
        {--hora-b=20:00 : Hora de la función de la película B}
        {--confirmar : Confirma que realmente se desea insertar el historial}';

    protected $description =
        'Genera una semana de historial cinematográfico sintético para Atlantic Cinema.';

    private array $resumen = [
        'clientes_creados' => 0,
        'funciones' => 0,
        'ventas' => 0,
        'reservas' => 0,
        'entradas' => 0,
        'tickets' => 0,
        'tickets_utilizados' => 0,
        'pagos' => 0,
    ];

    public function handle(): int
    {
        $this->newLine();
        $this->info('ATLANTIC CINEMA - GENERADOR DE HISTORIAL');
        $this->line('-----------------------------------------');

        try {
            $config = $this->validarOpciones();

            $this->mostrarPlan($config);

            if (! $this->option('confirmar')) {
                $this->newLine();
                $this->warn(
                    'No se realizó ningún cambio. '
                    . 'Vuelve a ejecutar el comando agregando --confirmar.'
                );

                return self::SUCCESS;
            }

            DB::transaction(function () use ($config) {
                $clientes = $this->crearORecuperarClientes(
                    $config['rol_cliente_id'],
                    $config['correo_base'],
                    $config['cantidad_clientes']
                );

                $this->generarSemana(
                    $config,
                    $clientes
                );
            }, 3);

            $this->newLine();
            $this->info('Historial generado correctamente.');

            $this->table(
                ['Elemento', 'Cantidad'],
                [
                    ['Clientes creados', $this->resumen['clientes_creados']],
                    ['Funciones', $this->resumen['funciones']],
                    ['Ventas', $this->resumen['ventas']],
                    ['Reservas convertidas', $this->resumen['reservas']],
                    ['Entradas', $this->resumen['entradas']],
                    ['Pagos aprobados', $this->resumen['pagos']],
                    ['Tickets', $this->resumen['tickets']],
                    ['Tickets utilizados', $this->resumen['tickets_utilizados']],
                ]
            );

            $this->newLine();
            $this->comment(
                'No se generaron facturas FEL, notificaciones, '
                . 'correos ni operaciones con Recurrente.'
            );

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error('No fue posible generar el historial.');
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }

    private function validarOpciones(): array
    {
        $inicioTexto = trim((string) $this->option('inicio'));
        $peliculaAId = (int) $this->option('pelicula-a');
        $peliculaBId = (int) $this->option('pelicula-b');
        $correoBase = strtolower(
            trim((string) $this->option('correo-base'))
        );

        $cantidadClientes = (int) $this->option('clientes');

        if ($inicioTexto === '') {
            throw new \RuntimeException(
                'Debes indicar --inicio=YYYY-MM-DD.'
            );
        }

        if ($peliculaAId <= 0 || $peliculaBId <= 0) {
            throw new \RuntimeException(
                'Debes indicar --pelicula-a y --pelicula-b.'
            );
        }

        if ($peliculaAId === $peliculaBId) {
            throw new \RuntimeException(
                'Las dos películas deben ser diferentes.'
            );
        }

        if (
            ! filter_var($correoBase, FILTER_VALIDATE_EMAIL)
            || ! str_ends_with($correoBase, '@gmail.com')
        ) {
            throw new \RuntimeException(
                '--correo-base debe ser una cuenta válida @gmail.com.'
            );
        }

        if ($cantidadClientes < 40 || $cantidadClientes > 150) {
            throw new \RuntimeException(
                '--clientes debe encontrarse entre 40 y 150.'
            );
        }

        $inicio = Carbon::createFromFormat(
            'Y-m-d',
            $inicioTexto,
            config('app.timezone')
        )->startOfDay();

        if ($inicio->dayOfWeekIso !== 2) {
            throw new \RuntimeException(
                'La fecha indicada en --inicio debe ser un martes.'
            );
        }

        $fin = $inicio->copy()
            ->addDays(5)
            ->endOfDay();

        if ($fin->isFuture()) {
            throw new \RuntimeException(
                'La semana debe haber finalizado completamente.'
            );
        }

        $peliculaA = DB::table('peliculas')
            ->where('id', $peliculaAId)
            ->whereNull('deleted_at')
            ->first();

        $peliculaB = DB::table('peliculas')
            ->where('id', $peliculaBId)
            ->whereNull('deleted_at')
            ->first();

        if (! $peliculaA || ! $peliculaB) {
            throw new \RuntimeException(
                'Una de las películas seleccionadas no existe.'
            );
        }

        if (
            $peliculaA->estado !== 'ACTIVA'
            || $peliculaB->estado !== 'ACTIVA'
        ) {
            throw new \RuntimeException(
                'Las dos películas deben encontrarse ACTIVA.'
            );
        }

        if (
            (int) $peliculaA->duracion_minutos <= 0
            || (int) $peliculaB->duracion_minutos <= 0
        ) {
            throw new \RuntimeException(
                'Las películas deben tener una duración válida.'
            );
        }

        $salaA = $this->obtenerSala(
            (string) $this->option('sala-a')
        );

        $salaB = $this->obtenerSala(
            (string) $this->option('sala-b')
        );

        if ((int) $salaA->id === (int) $salaB->id) {
            throw new \RuntimeException(
                'Para este generador deben utilizarse dos salas diferentes.'
            );
        }

        $formatoA = $this->obtenerFormato(
            (string) $this->option('formato-a')
        );

        $formatoB = $this->obtenerFormato(
            (string) $this->option('formato-b')
        );

        $horaA = $this->validarHora(
            (string) $this->option('hora-a')
        );

        $horaB = $this->validarHora(
            (string) $this->option('hora-b')
        );

        $rolCliente = DB::table('roles')
            ->whereRaw('LOWER(nombre) = ?', ['cliente'])
            ->where('estado', 'ACTIVO')
            ->first();

        if (! $rolCliente) {
            throw new \RuntimeException(
                'No se encontró el rol Cliente activo.'
            );
        }

        $metodoTarjeta = DB::table('metodos_pago')
            ->whereRaw('UPPER(codigo) = ?', ['TARJETA'])
            ->where('estado', 'ACTIVO')
            ->first();

        $metodoEfectivo = DB::table('metodos_pago')
            ->whereRaw('UPPER(codigo) = ?', ['EFECTIVO'])
            ->where('estado', 'ACTIVO')
            ->first();

        if (! $metodoTarjeta || ! $metodoEfectivo) {
            throw new \RuntimeException(
                'Deben existir los métodos TARJETA y EFECTIVO activos.'
            );
        }

        $this->validarSemanaDisponible(
            $inicio,
            $fin,
            [
                (int) $salaA->id,
                (int) $salaB->id,
            ]
        );

        return [
            'inicio' => $inicio,
            'fin' => $fin,
            'pelicula_a' => $peliculaA,
            'pelicula_b' => $peliculaB,
            'sala_a' => $salaA,
            'sala_b' => $salaB,
            'formato_a' => $formatoA,
            'formato_b' => $formatoB,
            'hora_a' => $horaA,
            'hora_b' => $horaB,
            'rol_cliente_id' => (int) $rolCliente->id,
            'metodo_tarjeta_id' => (int) $metodoTarjeta->id,
            'metodo_efectivo_id' => (int) $metodoEfectivo->id,
            'correo_base' => $correoBase,
            'cantidad_clientes' => $cantidadClientes,
        ];
    }

    private function obtenerSala(string $nombre): object
    {
        $sala = DB::table('salas')
            ->whereRaw('LOWER(nombre) = ?', [
                strtolower(trim($nombre)),
            ])
            ->where('estado', 'ACTIVA')
            ->whereNull('deleted_at')
            ->first();

        if (! $sala) {
            throw new \RuntimeException(
                "No se encontró la sala activa: {$nombre}."
            );
        }

        $cantidadAsientos = DB::table('asientos')
            ->where('sala_id', $sala->id)
            ->where('estado', 'ACTIVO')
            ->count();

        if ($cantidadAsientos === 0) {
            throw new \RuntimeException(
                "La sala {$nombre} no posee asientos activos."
            );
        }

        return $sala;
    }

    private function obtenerFormato(string $nombre): object
    {
        $formato = DB::table('formatos')
            ->whereRaw('UPPER(nombre) = ?', [
                strtoupper(trim($nombre)),
            ])
            ->where('estado', 'ACTIVO')
            ->first();

        if (! $formato) {
            throw new \RuntimeException(
                "No se encontró el formato activo {$nombre}."
            );
        }

        $nombreFormato = strtoupper($formato->nombre);

        if (! in_array($nombreFormato, ['2D', '3D'], true)) {
            throw new \RuntimeException(
                'El generador solamente admite formatos 2D o 3D.'
            );
        }

        return $formato;
    }

    private function validarHora(string $hora): string
    {
        $hora = trim($hora);

        $fecha = \DateTime::createFromFormat('H:i', $hora);

        if (
            ! $fecha
            || $fecha->format('H:i') !== $hora
        ) {
            throw new \RuntimeException(
                "Hora inválida: {$hora}. Utiliza HH:MM."
            );
        }

        return $hora;
    }

    private function validarSemanaDisponible(
        Carbon $inicio,
        Carbon $fin,
        array $salas
    ): void {
        $existen = DB::table('funciones')
            ->whereIn('sala_id', $salas)
            ->where('inicia_en', '>=', $inicio)
            ->where('inicia_en', '<=', $fin)
            ->exists();

        if ($existen) {
            throw new \RuntimeException(
                'Ya existen funciones en una de las salas '
                . 'durante la semana indicada. '
                . 'El comando se detuvo para evitar duplicados.'
            );
        }
    }

    private function mostrarPlan(array $config): void
    {
        $this->newLine();

        $this->table(
            ['Dato', 'Valor'],
            [
                [
                    'Semana',
                    $config['inicio']->format('d/m/Y')
                    . ' al '
                    . $config['fin']->format('d/m/Y'),
                ],
                [
                    'Película A',
                    $config['pelicula_a']->titulo,
                ],
                [
                    'Película B',
                    $config['pelicula_b']->titulo,
                ],
                [
                    'Sala A',
                    $config['sala_a']->nombre,
                ],
                [
                    'Sala B',
                    $config['sala_b']->nombre,
                ],
                [
                    'Formato A',
                    $config['formato_a']->nombre,
                ],
                [
                    'Formato B',
                    $config['formato_b']->nombre,
                ],
                [
                    'Hora A',
                    $config['hora_a'],
                ],
                [
                    'Hora B',
                    $config['hora_b'],
                ],
                [
                    'Clientes disponibles',
                    $config['cantidad_clientes'],
                ],
                [
                    'Correo base',
                    $config['correo_base'],
                ],
            ]
        );

        $this->newLine();
        $this->line(
            'Se crearán 12 funciones: '
            . '2 películas × martes a domingo.'
        );
        $this->line(
            'La ocupación variará aproximadamente entre 20 % y 40 %.'
        );
    }

    private function crearORecuperarClientes(
        int $rolClienteId,
        string $correoBase,
        int $cantidad
    ): array {
        [$local] = explode('@', $correoBase, 2);

        $nombres = [
            'Andrea', 'Carlos', 'Sofia', 'Diego', 'Valeria',
            'Luis', 'Daniela', 'Javier', 'Gabriela', 'Fernando',
            'Maria', 'Alejandro', 'Lucia', 'Jose', 'Camila',
            'Mateo', 'Paula', 'Ricardo', 'Isabella', 'Sebastian',
            'Ana', 'Miguel', 'Natalia', 'Eduardo', 'Mariana',
            'Pablo', 'Laura', 'David', 'Carolina', 'Andres',
            'Claudia', 'Manuel', 'Elena', 'Marco', 'Adriana',
            'Hector', 'Monica', 'Esteban', 'Patricia', 'Oscar',
        ];

        $apellidos = [
            'Garcia', 'Lopez', 'Martinez', 'Hernandez',
            'Gonzalez', 'Ramirez', 'Perez', 'Morales',
            'Castillo', 'Mendez', 'Rodriguez', 'Diaz',
            'Vasquez', 'Ruiz', 'Sanchez', 'Ortiz',
            'Reyes', 'Flores', 'Aguilar', 'Cabrera',
            'Alvarez', 'Herrera', 'Ramos', 'Contreras',
            'Fuentes', 'Marroquin', 'Escobar', 'Cardona',
            'Barrios', 'Rosales',
        ];

        $clientes = [];

        for ($i = 1; $i <= $cantidad; $i++) {
            $nombre = $nombres[
                ($i - 1) % count($nombres)
            ];

            $apellido1 = $apellidos[
                (($i * 3) - 1) % count($apellidos)
            ];

            $apellido2 = $apellidos[
                (($i * 7) + 3) % count($apellidos)
            ];

            if ($apellido1 === $apellido2) {
                $apellido2 = $apellidos[
                    (($i * 7) + 4) % count($apellidos)
                ];
            }

            $alias = strtolower(
                Str::ascii(
                    $nombre
                    . '.'
                    . $apellido1
                    . str_pad(
                        (string) $i,
                        2,
                        '0',
                        STR_PAD_LEFT
                    )
                )
            );

            $correo =
                $local
                . '+'
                . $alias
                . '@gmail.com';

            $cliente = DB::table('usuarios')
                ->where('correo', $correo)
                ->first();

            if (! $cliente) {
                $ahora = now();

                $id = DB::table('usuarios')
                    ->insertGetId([
                        'rol_id' => $rolClienteId,
                        'nombres' => $nombre,
                        'apellidos' =>
                            $apellido1 . ' ' . $apellido2,
                        'correo' => $correo,
                        'password' => Hash::make(
                            Str::random(40)
                        ),
                        'telefono' => null,
                        'nit' => null,
                        'direccion' => null,
                        'correo_verificado_en' => null,
                        'estado' => 'ACTIVO',
                        'ultimo_acceso_en' => null,
                        'remember_token' => null,
                        'created_at' => $ahora,
                        'updated_at' => $ahora,
                    ]);

                $cliente = DB::table('usuarios')
                    ->where('id', $id)
                    ->first();

                $this->resumen['clientes_creados']++;
            }

            $clientes[] = $cliente;
        }

        return $clientes;
    }

    private function generarSemana(
        array $config,
        array $clientes
    ): void {
        for ($offset = 0; $offset <= 5; $offset++) {
            $fecha = $config['inicio']
                ->copy()
                ->addDays($offset);

            $diaIso = $fecha->dayOfWeekIso;

            $ocupacionA =
                $this->obtenerOcupacion($diaIso);

            $ocupacionB =
                $this->obtenerOcupacion($diaIso);

            $funcionA =
                $this->crearFuncionHistorica(
                    $config['pelicula_a'],
                    $config['sala_a'],
                    $config['formato_a'],
                    $fecha,
                    $config['hora_a']
                );

            $funcionB =
                $this->crearFuncionHistorica(
                    $config['pelicula_b'],
                    $config['sala_b'],
                    $config['formato_b'],
                    $fecha,
                    $config['hora_b']
                );

            $this->generarVentasFuncion(
                $funcionA,
                $ocupacionA,
                $clientes,
                $config
            );

            $this->generarVentasFuncion(
                $funcionB,
                $ocupacionB,
                $clientes,
                $config
            );

            $this->line(
                $fecha->format('d/m/Y')
                . ' | '
                . $config['pelicula_a']->titulo
                . ': '
                . $ocupacionA
                . '% | '
                . $config['pelicula_b']->titulo
                . ': '
                . $ocupacionB
                . '%'
            );
        }
    }

    private function crearFuncionHistorica(
        object $pelicula,
        object $sala,
        object $formato,
        Carbon $fecha,
        string $hora
    ): object {
        $iniciaEn = Carbon::parse(
            $fecha->format('Y-m-d') . ' ' . $hora,
            config('app.timezone')
        );

        $finalizaEn =
            $this->calcularFinalizacion(
                $iniciaEn,
                (int) $pelicula->duracion_minutos
            );

        $precioBase =
            strtoupper($formato->nombre) === '3D'
                ? 45.00
                : 35.00;

        $creadaEn =
            $iniciaEn->copy()->subDays(7);

        $funcionId = DB::table('funciones')
            ->insertGetId([
                'pelicula_id' => $pelicula->id,
                'sala_id' => $sala->id,
                'formato_id' => $formato->id,
                'inicia_en' => $iniciaEn,
                'finaliza_en' => $finalizaEn,
                'precio_base' => $precioBase,
                'estado' => 'FINALIZADA',
                'created_at' => $creadaEn,
                'updated_at' => $finalizaEn,
            ]);

        $asientos = DB::table('asientos')
            ->where('sala_id', $sala->id)
            ->where('estado', 'ACTIVO')
            ->orderBy('fila')
            ->orderBy('numero')
            ->get();

        $registros = [];

        foreach ($asientos as $asiento) {
            $registros[] = [
                'funcion_id' => $funcionId,
                'asiento_id' => $asiento->id,
                'precio' => $precioBase,
                'estado' => 'DISPONIBLE',
                'bloqueado_hasta' => null,
                'created_at' => $creadaEn,
                'updated_at' => $creadaEn,
            ];
        }

        DB::table('funcion_asientos')
            ->insert($registros);

        $this->resumen['funciones']++;

        return (object) [
            'id' => $funcionId,
            'pelicula_id' => $pelicula->id,
            'pelicula_titulo' => $pelicula->titulo,
            'sala_id' => $sala->id,
            'sala_nombre' => $sala->nombre,
            'formato_id' => $formato->id,
            'inicia_en' => $iniciaEn,
            'finaliza_en' => $finalizaEn,
            'precio_base' => $precioBase,
        ];
    }

    private function calcularFinalizacion(
        Carbon $inicio,
        int $duracionMinutos
    ): Carbon {
        $fin = $inicio
            ->copy()
            ->addMinutes($duracionMinutos)
            ->second(0)
            ->microsecond(0);

        $resto = $fin->minute % 15;

        if ($resto !== 0) {
            $fin->addMinutes(15 - $resto);
        }

        return $fin;
    }

    private function obtenerOcupacion(
        int $diaIso
    ): int {
        return match ($diaIso) {
            2 => random_int(20, 25),
            3 => random_int(20, 30),
            4 => random_int(20, 30),
            5 => random_int(25, 35),
            6 => random_int(30, 40),
            7 => random_int(25, 40),

            default => throw new \RuntimeException(
                'El generador solamente trabaja de martes a domingo.'
            ),
        };
    }

    private function generarVentasFuncion(
        object $funcion,
        int $ocupacion,
        array $clientes,
        array $config
    ): void {
        $asientos = DB::table('funcion_asientos')
            ->where('funcion_id', $funcion->id)
            ->where('estado', 'DISPONIBLE')
            ->get()
            ->all();

        shuffle($asientos);

        $cantidadObjetivo = (int) round(
            count($asientos)
            * ($ocupacion / 100)
        );

        $seleccionados =
            array_slice(
                $asientos,
                0,
                $cantidadObjetivo
            );

        $grupos =
            $this->agruparAsientosEnVentas(
                $seleccionados
            );

        $clientesFuncion = $clientes;
        shuffle($clientesFuncion);

        foreach ($grupos as $indice => $grupo) {
            $cliente =
                $clientesFuncion[
                    $indice % count($clientesFuncion)
                ];

            $esReserva =
                random_int(1, 100) <= 30;

            $origen =
                $esReserva
                    ? 'RESERVA'
                    : 'COMPRA_WEB';

            $subtotal =
                count($grupo)
                * (float) $funcion->precio_base;

            $ventaEn =
                $funcion->inicia_en
                    ->copy()
                    ->subHours(
                        random_int(4, 72)
                    )
                    ->subMinutes(
                        random_int(0, 59)
                    );

            $pagadaEn =
                $ventaEn
                    ->copy()
                    ->addMinutes(
                        random_int(1, 5)
                    );

            $reservaId = null;

            if ($esReserva) {
                $reservaId =
                    $this->crearReservaConvertida(
                        $funcion,
                        $cliente,
                        $grupo,
                        $subtotal,
                        $ventaEn
                    );
            }

            $ventaId =
                $this->crearVenta(
                    $funcion,
                    $cliente,
                    $subtotal,
                    $origen,
                    $reservaId,
                    $ventaEn,
                    $pagadaEn
                );

            $metodoPagoId =
                $esReserva
                    ? $config['metodo_efectivo_id']
                    : $config['metodo_tarjeta_id'];

            $this->crearPago(
                $ventaId,
                $subtotal,
                $metodoPagoId,
                $esReserva,
                $pagadaEn
            );

            foreach ($grupo as $funcionAsiento) {
                $this->crearEntradaYTicket(
                    $ventaId,
                    $funcion,
                    $funcionAsiento,
                    $pagadaEn
                );
            }

            $this->resumen['ventas']++;
        }
    }

    private function agruparAsientosEnVentas(
        array $asientos
    ): array {
        $grupos = [];
        $posicion = 0;
        $total = count($asientos);

        $distribucion = [
            1,
            2, 2, 2, 2,
            3, 3, 3,
            4,
            5,
        ];

        while ($posicion < $total) {
            $tamano =
                $distribucion[
                    array_rand($distribucion)
                ];

            $restantes =
                $total - $posicion;

            $tamano = min(
                $tamano,
                $restantes,
                5
            );

            $grupos[] =
                array_slice(
                    $asientos,
                    $posicion,
                    $tamano
                );

            $posicion += $tamano;
        }

        return $grupos;
    }

    private function crearReservaConvertida(
        object $funcion,
        object $cliente,
        array $asientos,
        float $subtotal,
        Carbon $convertidaEn
    ): int {
        $reservadaEn =
            $convertidaEn
                ->copy()
                ->subMinutes(
                    random_int(15, 90)
                );

        $expiraEn =
            $reservadaEn
                ->copy()
                ->addHours(2);

        if (
            $expiraEn
                ->lessThanOrEqualTo(
                    $convertidaEn
                )
        ) {
            $expiraEn =
                $convertidaEn
                    ->copy()
                    ->addMinutes(30);
        }

        $codigo =
            'RES-'
            . strtoupper(
                Str::random(12)
            );

        $reservaId =
            DB::table('reservas')
                ->insertGetId([
                    'codigo' => $codigo,
                    'usuario_id' => $cliente->id,
                    'funcion_id' => $funcion->id,
                    'cantidad_entradas' => count($asientos),
                    'subtotal' => $subtotal,
                    'descuento' => 0,
                    'total' => $subtotal,
                    'estado' => 'CONVERTIDA',
                    'reservada_en' => $reservadaEn,
                    'expira_en' => $expiraEn,
                    'convertida_en' => $convertidaEn,
                    'cancelada_en' => null,
                    'motivo_cancelacion' => null,
                    'created_at' => $reservadaEn,
                    'updated_at' => $convertidaEn,
                ]);

        $detalles = [];

        foreach ($asientos as $asiento) {
            $detalles[] = [
                'reserva_id' => $reservaId,
                'funcion_asiento_id' => $asiento->id,
                'precio' => $asiento->precio,
                'estado' => 'CONVERTIDO',
                'created_at' => $reservadaEn,
                'updated_at' => $convertidaEn,
            ];
        }

        DB::table('reserva_detalles')
            ->insert($detalles);

        $this->resumen['reservas']++;

        return $reservaId;
    }

    private function crearVenta(
        object $funcion,
        object $cliente,
        float $subtotal,
        string $origen,
        ?int $reservaId,
        Carbon $realizadaEn,
        Carbon $pagadaEn
    ): int {
        return DB::table('ventas')
            ->insertGetId([
                'numero_venta' =>
                    'VEN-'
                    . strtoupper(
                        Str::random(12)
                    ),
                'cliente_id' => $cliente->id,
                'empleado_id' => null,
                'reserva_id' => $reservaId,
                'funcion_id' => $funcion->id,
                'origen' => $origen,
                'subtotal' => $subtotal,
                'descuento' => 0,
                'total' => $subtotal,
                'nit_facturacion' => 'CF',
                'nombre_facturacion' =>
                    'Consumidor Final',
                'estado' => 'PAGADA',
                'realizada_en' => $realizadaEn,
                'pagada_en' => $pagadaEn,
                'cancelada_en' => null,
                'motivo_cancelacion' => null,
                'created_at' => $realizadaEn,
                'updated_at' => $pagadaEn,
            ]);
    }

    private function crearPago(
        int $ventaId,
        float $total,
        int $metodoPagoId,
        bool $esReserva,
        Carbon $aprobadoEn
    ): void {
        DB::table('pagos')
            ->insert([
                'venta_id' => $ventaId,
                'metodo_pago_id' => $metodoPagoId,
                'proveedor' =>
                    $esReserva
                        ? 'TAQUILLA'
                        : 'SISTEMA',
                'referencia_proveedor' =>
                    'ATL-'
                    . strtoupper(
                        Str::random(16)
                    ),
                'monto' => $total,
                'moneda' => 'GTQ',
                'estado' => 'APROBADO',
                'autorizacion_codigo' =>
                    'ATL-'
                    . strtoupper(
                        Str::random(12)
                    ),
                'aprobado_en' => $aprobadoEn,
                'descripcion' => null,
                'created_at' => $aprobadoEn,
                'updated_at' => $aprobadoEn,
            ]);

        $this->resumen['pagos']++;
    }

    private function crearEntradaYTicket(
        int $ventaId,
        object $funcion,
        object $funcionAsiento,
        Carbon $emitidaEn
    ): void {
        $seraUtilizada =
            random_int(1, 100)
            <= random_int(90, 97);

        $utilizadaEn = null;

        if ($seraUtilizada) {
            $utilizadaEn =
                $funcion->inicia_en
                    ->copy()
                    ->addMinutes(
                        random_int(-20, 20)
                    );
        }

        $estadoEntrada =
            $seraUtilizada
                ? 'UTILIZADA'
                : 'VALIDA';

        $entradaId =
            DB::table('entradas')
                ->insertGetId([
                    'venta_id' => $ventaId,
                    'funcion_asiento_id' =>
                        $funcionAsiento->id,
                    'codigo' =>
                        'ENT-'
                        . strtoupper(
                            Str::random(16)
                        ),
                    'precio' =>
                        $funcionAsiento->precio,
                    'estado' => $estadoEntrada,
                    'emitida_en' => $emitidaEn,
                    'utilizada_en' => $utilizadaEn,
                    'cancelada_en' => null,
                    'reembolsada_en' => null,
                    'created_at' => $emitidaEn,
                    'updated_at' =>
                        $utilizadaEn
                        ?? $emitidaEn,
                ]);

        DB::table('funcion_asientos')
            ->where(
                'id',
                $funcionAsiento->id
            )
            ->update([
                'estado' => 'VENDIDO',
                'bloqueado_hasta' => null,
                'updated_at' =>
                    $utilizadaEn
                    ?? $emitidaEn,
            ]);

        DB::table('tickets')
            ->insert([
                'entrada_id' => $entradaId,
                'codigo' =>
                    'TKT-'
                    . strtoupper(
                        Str::random(16)
                    ),
                'token_validacion' =>
                    hash(
                        'sha256',
                        Str::uuid()->toString()
                        . Str::random(40)
                    ),
                'formato' => 'PDF',
                'estado' =>
                    $seraUtilizada
                        ? 'UTILIZADO'
                        : 'ACTIVO',
                'pdf_url' => null,
                'qr_url' => null,
                'generado_en' => $emitidaEn,
                'utilizado_en' => $utilizadaEn,
                'cancelado_en' => null,
                'invalidado_en' => null,
                'motivo_invalidacion' => null,
                'version' => 1,
                'created_at' => $emitidaEn,
                'updated_at' =>
                    $utilizadaEn
                    ?? $emitidaEn,
            ]);

        $this->resumen['entradas']++;
        $this->resumen['tickets']++;

        if ($seraUtilizada) {
            $this->resumen['tickets_utilizados']++;
        }
    }
}
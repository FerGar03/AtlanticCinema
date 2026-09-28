<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">

    <title>
        Ticket {{ $ticket->codigo }}
    </title>

    <style>
        @page {
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111827;
            font-family: DejaVu Sans, sans-serif;
        }

        .ticket {
            width: 200px;
            margin-left: auto;
            margin-right: auto;
            padding-top: 14px;
            text-align: center;
        }

        .marca {
            width: 100%;
            margin: 0 0 2px;
            color: #008f95;
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 1px;
            text-align: center;
            white-space: nowrap;
        }

        .submarca {
            width: 100%;
            margin: 0 0 9px;
            color: #6b7280;
            font-size: 6px;
            letter-spacing: 1px;
            text-align: center;
            text-transform: uppercase;
        }

        .linea {
            width: 100%;
            margin: 8px 0;
            border-top: 1px dashed #b6bec8;
        }

        .pelicula {
            width: 100%;
            margin: 7px 0 4px;
            padding: 0 5px;
            font-size: 10px;
            font-weight: bold;
            line-height: 1.35;
            text-align: center;
            text-transform: uppercase;
            word-wrap: break-word;
        }

        .sala {
            width: 100%;
            margin: 0 0 6px;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
        }

        .asiento-tabla {
            width: 100%;
            margin: 5px 0 7px;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .asiento-tabla td {
            width: 50%;
            padding: 3px;
            text-align: center;
        }

        .etiqueta {
            color: #6b7280;
            font-size: 6px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .valor-grande {
            color: #008f95;
            font-size: 19px;
            font-weight: bold;
            line-height: 1.1;
        }

        .datos-tabla {
            width: 80%;
            margin-left: auto;
            margin-right: auto;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .datos-tabla td {
            padding: 3px 2px;
            font-size: 7px;
            vertical-align: middle;
        }

        .datos-etiqueta {
            width: 44%;
            padding-right: 7px !important;
            color: #6b7280;
            text-align: right;
        }

        .datos-valor {
            width: 56%;
            padding-left: 7px !important;
            font-weight: bold;
            text-align: left;
        }

        /*
         * Zona reservada exclusivamente
         * para el QR dibujado desde
         * TicketController.
         *
         * Se aumenta la altura para impedir
         * que el QR alcance el texto inferior.
         */
        .qr-espacio {
            width: 100%;
            height: 148px;
        }

        .instruccion {
            width: 100%;
            margin: 8px 0 6px;
            color: #6b7280;
            font-size: 6px;
            line-height: 1.4;
            text-align: center;
        }

        .codigo {
            width: 100%;
            margin-top: 3px;
            font-size: 7px;
            font-weight: bold;
            letter-spacing: 0.2px;
            text-align: center;
            word-wrap: break-word;
        }

        .estado-contenedor {
            width: 100%;
            margin-top: 7px;
            text-align: center;
        }

        .estado {
            display: inline-block;
            padding: 2px 7px;
            border: 1px solid #008f95;
            border-radius: 9px;
            color: #008f95;
            font-size: 6px;
            font-weight: bold;
        }

        .linea-final {
            width: 100%;
            margin: 11px 0 8px;
            border-top: 1px dashed #b6bec8;
        }

        .mensaje-final {
            width: 100%;
            margin: 0;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
        }

        .venta {
            width: 100%;
            margin-top: 5px;
            color: #9ca3af;
            font-size: 5px;
            text-align: center;
            word-wrap: break-word;
        }

        .advertencia {
            width: 100%;
            margin-top: 6px;
            padding: 0 5px;
            color: #6b7280;
            font-size: 5px;
            line-height: 1.4;
            text-align: center;
        }
    </style>
</head>

<body>

@php
    $entrada =
        $ticket->entrada;

    $funcionAsiento =
        $entrada?->funcionAsiento;

    $asiento =
        $funcionAsiento?->asiento;

    $funcion =
        $funcionAsiento?->funcion;

    $pelicula =
        $funcion?->pelicula;

    $sala =
        $funcion?->sala;

    $formato =
        $funcion?->formato;

    $venta =
        $entrada?->venta;
@endphp

<div class="ticket">

    <div class="marca">
        ATLANTIC CINEMA
    </div>

    <div class="submarca">
        Ticket electrónico
    </div>

    <div class="linea"></div>

    <div class="pelicula">
        {{ $pelicula?->titulo ?? 'Película' }}
    </div>

    <div class="sala">
        {{ $sala?->nombre ?? 'Sala' }}
    </div>

    <table class="asiento-tabla">
        <tr>

            <td>
                <div class="etiqueta">
                    Fila
                </div>

                <div class="valor-grande">
                    {{ $asiento?->fila ?? '-' }}
                </div>
            </td>

            <td>
                <div class="etiqueta">
                    Asiento
                </div>

                <div class="valor-grande">
                    {{ $asiento?->numero ?? '-' }}
                </div>
            </td>

        </tr>
    </table>

    <div class="linea"></div>

    <table class="datos-tabla">

        <tr>
            <td class="datos-etiqueta">
                Fecha
            </td>

            <td class="datos-valor">
                {{
                    $funcion?->inicia_en
                        ? $funcion->inicia_en->format('d/m/Y')
                        : '-'
                }}
            </td>
        </tr>

        <tr>
            <td class="datos-etiqueta">
                Hora
            </td>

            <td class="datos-valor">
                {{
                    $funcion?->inicia_en
                        ? $funcion->inicia_en->format('H:i')
                        : '-'
                }}
            </td>
        </tr>

        <tr>
            <td class="datos-etiqueta">
                Formato
            </td>

            <td class="datos-valor">
                {{ $formato?->nombre ?? '-' }}
            </td>
        </tr>

        <tr>
            <td class="datos-etiqueta">
                Precio
            </td>

            <td class="datos-valor">
                Q{{
                    number_format(
                        (float) (
                            $entrada?->precio
                            ?? 0
                        ),
                        2
                    )
                }}
            </td>
        </tr>

    </table>

    <div class="linea"></div>

    <div class="qr-espacio"></div>

    <div class="instruccion">
        Presenta este código QR al ingresar a la sala.
    </div>

    <div class="codigo">
        {{ $ticket->codigo }}
    </div>

    <div class="estado-contenedor">
        <span class="estado">
            {{ $ticket->estado }}
        </span>
    </div>

    <div class="linea-final"></div>

    <div class="mensaje-final">
        ¡Disfrute la función!
    </div>

    @if ($venta)

        <div class="venta">
            Venta:
            {{ $venta->numero_venta }}
        </div>

    @endif

    <div class="advertencia">
        Este ticket es válido únicamente para la función,
        fecha, hora y asiento indicados.
    </div>

</div>

</body>
</html>
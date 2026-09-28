import {
  Link,
} from 'react-router-dom'

import logoAtlantic
  from '../assets/branding/atlantic-cinema-logo.png'

function PagoCancelado() {
  return (
    <main className="pago-resultado-pagina pago-resultado-pagina-final">
      <header className="pago-resultado-navbar">
        <Link
          to="/"
          className="cartelera-marca"
        >
          <div className="pago-resultado-logo">
            <img
              src={logoAtlantic}
              alt="Atlantic Cinema"
            />
          </div>

          <div>
            <strong>
              Atlantic Cinema
            </strong>

            <small>
              Vive la experiencia
            </small>
          </div>
        </Link>

        <Link
          to="/"
          className="pago-resultado-navbar-volver"
        >
          ← Cartelera
        </Link>
      </header>

      <section className="pago-resultado-card">
        <div className="pago-resultado-icono pago-resultado-icono-cancelado">
          ×
        </div>

        <span className="pago-resultado-etiqueta pago-resultado-etiqueta-cancelado">
          PAGO NO COMPLETADO
        </span>

        <h1>
          El pago no se completó
        </h1>

        <p className="pago-resultado-descripcion">
          La operación con Recurrente fue
          cancelada o no llegó a completarse.
          No se ha confirmado ningún cobro
          para esta compra.
        </p>

        <div className="pago-resultado-aviso pago-resultado-aviso-cancelado">
          <strong>
            Tus asientos no están vendidos
          </strong>

          <p>
            Si habías iniciado una compra,
            los asientos pueden permanecer
            retenidos temporalmente hasta
            que el sistema libere el bloqueo
            correspondiente.
          </p>
        </div>

        <div className="pago-resultado-pasos">
          <div className="pago-paso pago-paso-completo">
            <span>
              ✓
            </span>

            <div>
              <strong>
                Compra iniciada
              </strong>

              <small>
                Atlantic Cinema generó la
                operación de compra.
              </small>
            </div>
          </div>

          <div className="pago-paso pago-paso-cancelado">
            <span>
              ×
            </span>

            <div>
              <strong>
                Pago no confirmado
              </strong>

              <small>
                Recurrente no confirmó el
                pago de la operación.
              </small>
            </div>
          </div>

          <div className="pago-paso">
            <span>
              3
            </span>

            <div>
              <strong>
                Asientos pendientes de liberación
              </strong>

              <small>
                El sistema liberará los
                asientos cuando corresponda.
              </small>
            </div>
          </div>
        </div>

        <div className="pago-resultado-acciones pago-resultado-acciones-doble">
          <Link
            to="/mis-operaciones"
            className="pago-resultado-boton-secundario"
          >
            Ver mis operaciones
          </Link>

          <Link
            to="/"
            className="pago-resultado-boton-principal"
          >
            Volver a la cartelera
          </Link>
        </div>

        <p className="pago-resultado-nota">
          Si realizaste un cargo y no ves
          la compra confirmada, evita repetir
          el pago hasta verificar el estado
          de la operación.
        </p>
      </section>
    </main>
  )
}

export default PagoCancelado
function AdminPaginacion({
  paginaActual,
  ultimaPagina,
  porPagina,
  total,
  desde,
  hasta,
  onCambiarPagina,
  onCambiarPorPagina,
  deshabilitado = false,
}) {
  const pagina =
    Number(
      paginaActual
      ?? 1
    )

  const ultima =
    Math.max(
      1,
      Number(
        ultimaPagina
        ?? 1
      )
    )

  const totalRegistros =
    Number(
      total
      ?? 0
    )

  const desdeRegistro =
    Number(
      desde
      ?? 0
    )

  const hastaRegistro =
    Number(
      hasta
      ?? 0
    )

  return (
    <div className="admin-paginacion">
      <div className="admin-paginacion-resumen">
        {totalRegistros > 0 ? (
          <span>
            Mostrando{' '}
            <strong>
              {desdeRegistro}
            </strong>
            {' – '}
            <strong>
              {hastaRegistro}
            </strong>
            {' de '}
            <strong>
              {totalRegistros}
            </strong>
            {' registros'}
          </span>
        ) : (
          <span>
            0 registros
          </span>
        )}
      </div>

      <div className="admin-paginacion-controles">
        <label>
          Mostrar

          <select
            value={
              porPagina
            }
            onChange={(event) =>
              onCambiarPorPagina(
                Number(
                  event.target.value
                )
              )
            }
            disabled={
              deshabilitado
            }
          >
            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>

            <option value={100}>
              100
            </option>
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            onCambiarPagina(
              pagina - 1
            )
          }
          disabled={
            deshabilitado
            || pagina <= 1
          }
        >
          ← Anterior
        </button>

        <span className="admin-paginacion-pagina">
          Página{' '}
          <strong>
            {pagina}
          </strong>
          {' de '}
          <strong>
            {ultima}
          </strong>
        </span>

        <button
          type="button"
          onClick={() =>
            onCambiarPagina(
              pagina + 1
            )
          }
          disabled={
            deshabilitado
            || pagina >= ultima
          }
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}

export default AdminPaginacion
import Icono from './Icono';
export default function FormularioCabana({
  cabanas,
  cabanaSeleccionadaId,
  alSeleccionarCabana,
  nombreReservacion,
  alCambiarNombreReservacion,
  noches,
  alCambiarNoches,
  huespedesTotales,
  alCambiarHuespedesTotales,
  anticipo,
  alCambiarAnticipo,
  descuentoEspecial,
  alCambiarDescuentoEspecial,
  temporada
}) {
  const cabanaActual = cabanas.find(
    (c) => String(c.id) === String(cabanaSeleccionadaId)
  );

  let precioNoche = 0;
  if (cabanaActual) {
    if (temporada === 'fin_semana') {
      precioNoche = Number(cabanaActual.precio_fin_semana);
    } else if (temporada === 'temporada_alta') {
      precioNoche = Number(cabanaActual.precio_temporada_alta);
    } else {
      precioNoche = Number(cabanaActual.precio_entre_semana);
    }
  }

  const capacidadBase = cabanaActual ? Number(cabanaActual.capacidad) : 0;
  const numHuespedes = Number(huespedesTotales) || 0;
  const personasExtra = (cabanaActual && numHuespedes > capacidadBase) 
    ? numHuespedes - capacidadBase 
    : 0;
  const cargoPersonasExtra = personasExtra * 250;

  return (
    <section className="karinga-tarjeta karinga-seccion-bloque">
      <div className="karinga-seccion-header">
        <div className="karinga-seccion-badge">Sección 2</div>
        <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
          <Icono nombre="bed" tamano={20} color="var(--verde-oscuro)" />
          <span>Reserva de Cabañas y Glampings</span>
        </h2>
      </div>

      <div className="karinga-fila-campos">
        <div className="karinga-campo" style={{ flex: 1.5 }}>
          <label htmlFor="selector-cabana">
            Seleccionar Cabaña o Glamping
          </label>
          <select
            id="selector-cabana"
            className="karinga-select"
            value={cabanaSeleccionadaId || ''}
            onChange={(e) => alSeleccionarCabana(e.target.value)}
          >
            <option value="">-- Ninguna (Solo venta de actividades/visitas/camping) --</option>
            {cabanas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (Cap: {c.capacidad} pers.)
              </option>
            ))}
          </select>
        </div>

        <div className="karinga-campo" style={{ flex: 1.5 }}>
          <label htmlFor="input-nombre-reservacion">
            Nombre de quien hace la reservación
            {cabanaActual && <span className="requerido">* (Obligatorio)</span>}
          </label>
          <input
            id="input-nombre-reservacion"
            type="text"
            className="karinga-input"
            placeholder={cabanaActual ? 'Ej. Juan Pérez García' : 'Opcional si solo son actividades'}
            value={nombreReservacion}
            onChange={(e) => alCambiarNombreReservacion(e.target.value)}
            required={Boolean(cabanaActual)}
          />
        </div>
      </div>

      {cabanaActual && (
        <>
          <div className="karinga-cabana-detalle">
            <div className="karinga-dato-pill">
              <span className="etiqueta">Capacidad Base</span>
              <span className="valor">{cabanaActual.capacidad} personas</span>
            </div>

            <div className="karinga-dato-pill">
              <span className="etiqueta">Precio por Noche</span>
              <span className="valor resaltado">
                ${precioNoche.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="karinga-dato-pill">
              <span className="etiqueta">Depósito Requerido</span>
              <span className="valor" style={{ color: 'var(--amarillo-sol-hover)' }}>
                ${Number(cabanaActual.deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="karinga-fila-campos" style={{ marginTop: '1.25rem' }}>
            <div className="karinga-campo">
              <label htmlFor="input-noches">
                Número de Noches <span className="requerido">*</span>
              </label>
              <input
                id="input-noches"
                type="number"
                min="1"
                className="karinga-input"
                value={noches}
                onChange={(e) => alCambiarNoches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                required
              />
            </div>

            <div className="karinga-campo">
              <label htmlFor="input-huespedes">
                Huéspedes Totales (para pulseras) <span className="requerido">*</span>
              </label>
              <input
                id="input-huespedes"
                type="number"
                min="1"
                className="karinga-input"
                placeholder="Número de personas"
                value={huespedesTotales}
                onChange={(e) => alCambiarHuespedesTotales(Math.max(0, parseInt(e.target.value, 10) || 0))}
                required
              />
            </div>
          </div>

          {personasExtra > 0 && (
            <div className="karinga-alerta-extra">
              <Icono nombre="alert" tamano={24} color="#D97706" />
              <div>
                <strong>Huéspedes adicionales detectados: </strong>
                La capacidad base es de {capacidadBase} personas y se registraron {numHuespedes}.
                Se agregan automáticamente <strong>{personasExtra} persona(s) extra</strong> por un total de{' '}
                <strong>+${cargoPersonasExtra.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> ($250.00 c/u).
              </div>
            </div>
          )}
        </>
      )}

      <div className="karinga-fila-campos" style={{ marginTop: '1.25rem' }}>
        <div className="karinga-campo">
          <label htmlFor="input-anticipo">
            Comprobante de Anticipo ($ MXN)
          </label>
          <input
            id="input-anticipo"
            type="number"
            min="0"
            step="0.01"
            className="karinga-input"
            placeholder="0.00"
            value={anticipo === 0 ? '' : anticipo}
            onChange={(e) => alCambiarAnticipo(Math.max(0, parseFloat(e.target.value) || 0))}
          />
          <small style={{ color: 'var(--gris-medio)', fontSize: '0.78rem' }}>Resta directamente al total a liquidar</small>
        </div>

        <div className="karinga-campo">
          <label htmlFor="input-descuento">
            Descuento Especial ($ MXN)
          </label>
          <input
            id="input-descuento"
            type="number"
            min="0"
            step="0.01"
            className="karinga-input"
            placeholder="0.00"
            value={descuentoEspecial === 0 ? '' : descuentoEspecial}
            onChange={(e) => alCambiarDescuentoEspecial(Math.max(0, parseFloat(e.target.value) || 0))}
          />
          <small style={{ color: 'var(--gris-medio)', fontSize: '0.78rem' }}>Aplica deducción autorizada</small>
        </div>
      </div>
    </section>
  );
}

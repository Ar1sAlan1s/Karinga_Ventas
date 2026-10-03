export const TARIFAS_ACTIVIDADES = {
  COSTO_PERSONA_EXTRA: 250,
  VISITA_PERSONA: 95,
  CAMPING_NORMAL: 140,
  CAMPING_ALTA: 160,
  TIROLESA_BOLETO: 250,
  CABALGATA_30MIN: 150,
  CABALGATA_1HORA: 200,
  GOTCHA: 2900,
  INTERACCION_ANIMALES: 200,
  FRESA_KILO: 120,
  FRESA_MEDIO: 60,
  MIEL_LITRO: 200,
  HUEVO_CONO: 110,
  HUEVO_PIEZA: 4,
  PAQUETE_GRANJA: 220,
  PAQUETE_VIVE: 450,
  SENDERISMO_MIN_6: 70,
  SENDERISMO_HASTA_5: 100
};

export const CABANAS_INICIALES = [
  {
    id: 1,
    nombre: 'Glamping Irekani',
    capacidad: 2,
    precio_entre_semana: 760.00,
    precio_fin_semana: 850.00,
    precio_temporada_alta: 999.00,
    deposito: 250.00
  },
  {
    id: 2,
    nombre: 'Glamping Jaracuaro',
    capacidad: 2,
    precio_entre_semana: 960.00,
    precio_fin_semana: 1060.00,
    precio_temporada_alta: 1250.00,
    deposito: 250.00
  },
  {
    id: 3,
    nombre: 'Tecuenita',
    capacidad: 2,
    precio_entre_semana: 1400.00,
    precio_fin_semana: 1560.00,
    precio_temporada_alta: 1840.00,
    deposito: 500.00
  },
  {
    id: 4,
    nombre: 'Buena Vista',
    capacidad: 2,
    precio_entre_semana: 1770.00,
    precio_fin_semana: 1970.00,
    precio_temporada_alta: 2320.00,
    deposito: 500.00
  },
  {
    id: 5,
    nombre: 'Tecuen',
    capacidad: 3,
    precio_entre_semana: 2340.00,
    precio_fin_semana: 2600.00,
    precio_temporada_alta: 3070.00,
    deposito: 500.00
  },
  {
    id: 6,
    nombre: 'Pacanda',
    capacidad: 4,
    precio_entre_semana: 3660.00,
    precio_fin_semana: 4070.00,
    precio_temporada_alta: 4800.00,
    deposito: 600.00
  },
  {
    id: 7,
    nombre: 'Yunuen',
    capacidad: 7,
    precio_entre_semana: 4410.00,
    precio_fin_semana: 4900.00,
    precio_temporada_alta: 5780.00,
    deposito: 600.00
  },
  {
    id: 8,
    nombre: 'Santa Fe',
    capacidad: 6,
    precio_entre_semana: 4650.00,
    precio_fin_semana: 5160.00,
    precio_temporada_alta: 6093.00,
    deposito: 600.00
  },
  {
    id: 9,
    nombre: 'Janitzio',
    capacidad: 10,
    precio_entre_semana: 6224.00,
    precio_fin_semana: 6915.00,
    precio_temporada_alta: 8160.00,
    deposito: 800.00
  },
  {
    id: 10,
    nombre: 'Chupicuaro',
    capacidad: 22,
    precio_entre_semana: 9720.00,
    precio_fin_semana: 10800.00,
    precio_temporada_alta: 12750.00,
    deposito: 1000.00
  },
  {
    id: 11,
    nombre: 'Hostal Uranden',
    capacidad: 16,
    precio_entre_semana: 6020.00,
    precio_fin_semana: 5920.00,
    precio_temporada_alta: 6990.00,
    deposito: 1500.00
  },
  {
    id: 12,
    nombre: 'HH Santa Clara',
    capacidad: 8,
    precio_entre_semana: 3960.00,
    precio_fin_semana: 4400.00,
    precio_temporada_alta: 5190.00,
    deposito: 600.00
  },
  {
    id: 13,
    nombre: 'Glamping Erandini',
    capacidad: 2,
    precio_entre_semana: 760.00,
    precio_fin_semana: 850.00,
    precio_temporada_alta: 999.00,
    deposito: 250.00
  }
];

export const OPCIONES_TEMPORADA = [
  { id: 'entre_semana', etiqueta: 'Entre semana', descripcion: 'Lunes a Jueves' },
  { id: 'fin_semana', etiqueta: 'Fin de semana', descripcion: 'Viernes a Domingo' },
  { id: 'temporada_alta', etiqueta: 'Temporada alta', descripcion: 'Vacaciones y Feriados' }
];

export const METODOS_PAGO = [
  { id: 'Efectivo', etiqueta: 'Efectivo' },
  { id: 'Transferencia BBVA', etiqueta: 'Transferencia BBVA' },
  { id: 'Transferencia Bajío', etiqueta: 'Transferencia Bajío' },
  { id: 'Tarjeta', etiqueta: 'Tarjeta' }
];

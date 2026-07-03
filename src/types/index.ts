export interface RutaTransporte {
  id: number;
  ruta: string;
  unidades: number;
  cooperativa: string;
  showUnitsLabel?: boolean;
  colorTheme?: 'yellow' | 'blue';
}

export interface ConsumoInstitucion {
  institucion: string;
  unidades: number;
  litros: number;
  tipoCombustible?: 'gasolina' | 'diesel' | 'mixto'; // Optional categorization helper
}

export interface DisponibilidadEstacion {
  estacion: string;
  gasolina: number;
  diesel: number;
}

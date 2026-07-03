import { RutaTransporte, ConsumoInstitucion, DisponibilidadEstacion } from '../types';

export const mockRutas: RutaTransporte[] = [
  { id: 1, ruta: "CARAYACA - CATIA LA MAR", unidades: 4, cooperativa: "U-C SAN JOSE DE CARAYACA Y COLECTIVOS CARAYACA", showUnitsLabel: true, colorTheme: "yellow" },
  { id: 2, ruta: "LAS TUNITAS - CATIA LA MAR", unidades: 3, cooperativa: "UNION DE CHOFERES", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 3, ruta: "SAN REMO - CATIA LA MAR", unidades: 3, cooperativa: "COOP. TOUR VARG", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 4, ruta: "LA ESPERANZA - CATIA LA MAR", unidades: 10, cooperativa: "COOP. TUCAN DE QUERE Y HALCONES DE LA ESPERANZA", showUnitsLabel: true, colorTheme: "yellow" },
  { id: 5, ruta: "LOS OLIVOS DE LA SOUBLETTE - LOS TUBOS - REDOMA DE LA -", unidades: 4, cooperativa: "U.C. LOS OLIVOS LA PICHONA Y RUSTY TAXI", showUnitsLabel: true, colorTheme: "yellow" },
  { id: 6, ruta: "CATIA LA MAR - CARIBE", unidades: 17, cooperativa: "UNION DE CHOFERES, LA MURALLA, GENERAL, SOUBLETTE, JOSE MARIA VARGAS, ASOCAVA Y PROVOLVAR", showUnitsLabel: true, colorTheme: "blue" },
  { id: 7, ruta: "LA JUNGLA CATIA LA MAR", unidades: 3, cooperativa: "U.C LA JUNGLA", showUnitsLabel: true, colorTheme: "yellow" },
  { id: 8, ruta: "MIRABAL CATIA LA MAR", unidades: 5, cooperativa: "U.C MIRABAL", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 9, ruta: "HUGO CHAVEZ - CATIA LA MAR", unidades: 5, cooperativa: "BRISAS DE PLAYA GRANDE", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 10, ruta: "EZEQUIEL ZAMORA - VALLE LA CRUZ LAS COLINAS - LOS OLIVOS", unidades: 5, cooperativa: "U.C EZEQUIEL ZAMORA Y U.C ZAMORA LA COLINA", showUnitsLabel: false, colorTheme: "blue" },
  { id: 11, ruta: "PETIT MEDINA - CATIA LA MAR", unidades: 3, cooperativa: "U.C PETIT MEDINA", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 12, ruta: "CANAIMA - MACUTO", unidades: 3, cooperativa: "U.C JOSE MARIA VARGAS", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 13, ruta: "MALBORO - MACUTO", unidades: 3, cooperativa: "U.C GENERAL SOUBLETTE", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 14, ruta: "LA PEDRERA MACUTO", unidades: 4, cooperativa: "U.C PROVOLVAR", showUnitsLabel: true, colorTheme: "yellow" },
  { id: 15, ruta: "EL RINCÓN - SANTA ANA - MAIQUETIA", unidades: 5, cooperativa: "U.C EL RINCON 13 DE FEBRERO", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 16, ruta: "QUENEPE - MAIQUETIA", unidades: 5, cooperativa: "U.C MAILAGU", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 17, ruta: "PUNTA DE MULATOS - LA GUAIRA", unidades: 2, cooperativa: "U.C PLAZA VARGAS EL TANQUE", showUnitsLabel: true, colorTheme: "blue" },
  { id: 18, ruta: "EL TELEFERICO - MACUTO", unidades: 2, cooperativa: "U.C EL TELEFERICO", showUnitsLabel: true, colorTheme: "blue" },
  { id: 19, ruta: "PLAYA LIDO - VALLE DEL PINO", unidades: 2, cooperativa: "U.C PLAYA LIDO", showUnitsLabel: true, colorTheme: "blue" },
  { id: 20, ruta: "VALLE DEL PINO - EL PALMAR", unidades: 4, cooperativa: "U.C VALLE DEL PINO Y U.C VALLE CORAL", showUnitsLabel: false, colorTheme: "blue" },
  { id: 21, ruta: "NAIGUATA - ANARE - CAMURIEL TRIGRILLO", unidades: 3, cooperativa: "U.C LA SUCESORA", showUnitsLabel: false, colorTheme: "blue" },
  { id: 23, ruta: "LA COSTA LA GUAIRA", unidades: 4, cooperativa: "RUSTICOS DE LA COSTA, RUSTICOS DEL CARIBE Y CONDUCTORES DE LA COSTA", showUnitsLabel: true, colorTheme: "blue" },
  { id: 24, ruta: "GUAMACHO - CABRERIA - GUARATARO", unidades: 3, cooperativa: "U.C GUAMACHO", showUnitsLabel: false, colorTheme: "yellow" },
  { id: 25, ruta: "EL PIACHE CATIA LA MAR", unidades: 3, cooperativa: "U.C EL PIACHE", showUnitsLabel: false, colorTheme: "blue" },
  { id: 26, ruta: "MARAPA MARINA - CATIA LA MAR", unidades: 3, cooperativa: "U.C MARAPA MARINA", showUnitsLabel: false, colorTheme: "blue" }
];

export const mockConsumoInstituciones: ConsumoInstitucion[] = [
  { institucion: "CONTINGENCIA GOBERNACION", unidades: 420, litros: 35000, tipoCombustible: "gasolina" },
  { institucion: "CONTINGENCIA GOBERNACION", unidades: 300, litros: 25000, tipoCombustible: "diesel" },
  { institucion: "ALCALDIA", unidades: 280, litros: 22000, tipoCombustible: "gasolina" },
  { institucion: "ALCALDIA", unidades: 200, litros: 18000, tipoCombustible: "diesel" },
  { institucion: "PERSONAL DE SALUD", unidades: 190, litros: 15000, tipoCombustible: "gasolina" },
  { institucion: "PERSONAL DE SALUD", unidades: 100, litros: 8000, tipoCombustible: "diesel" },
  { institucion: "SEGURIDAD CIUDADANA", unidades: 210, litros: 18000, tipoCombustible: "gasolina" },
  { institucion: "SEGURIDAD CIUDADANA", unidades: 150, litros: 15000, tipoCombustible: "diesel" },
  { institucion: "TRANSPORTE PUBLICO", unidades: 350, litros: 25000, tipoCombustible: "gasolina" },
  { institucion: "TRANSPORTE PUBLICO", unidades: 400, litros: 30000, tipoCombustible: "diesel" }
];

export const mockEstaciones: DisponibilidadEstacion[] = [
  { estacion: "MIRAMAR", gasolina: 95000, diesel: 85000 },
  { estacion: "ALDO", gasolina: 60000, diesel: 50000 },
  { estacion: "AEROPUERTO", gasolina: 75000, diesel: 70000 },
  { estacion: "SOUBLETTE", gasolina: 0, diesel: 0 },
  { estacion: "LA ZORRA", gasolina: 0, diesel: 0 },
  { estacion: "PARQUE MARÍTIMO", gasolina: 40000, diesel: 35000 },
  { estacion: "CARABALLEDA", gasolina: 55000, diesel: 45000 },
  { estacion: "NAIGUATÁ", gasolina: 30000, diesel: 25000 }
];

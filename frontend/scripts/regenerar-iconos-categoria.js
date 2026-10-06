const fs = require('fs');
const path = require('path');

const svgDir = path.resolve(__dirname, '../src/app/compartidos/SVGs');
const targetFile = path.resolve(
  __dirname,
  '../src/app/compartidos/componentes/sobre-marca/iconos-categoria.ts'
);

const svgFiles = {
  tecnologia: 'Icon_TecnoInv.svg',
  cosmetica: 'Icon_CosmeInv.svg',
  entretenimiento: 'Icon_EntretenimientoInv.svg',
  gastronomia: 'Icon_GastroInv.svg',
  indumentaria: 'Icon_IndumentariaInv.svg',
  musica: 'Icon_MusicaINV.svg',
};

function extraerDatosSvg(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extraer viewBox
  const vbMatch = content.match(/viewBox=["']([^"']+)["']/i);
  if (!vbMatch) {
    throw new Error(`viewBox no encontrado en ${filePath}`);
  }
  const parts = vbMatch[1].trim().split(/\s+/).map(Number);
  const ancho = parts[2];
  const alto = parts[3];

  // Descartar los <g> y quedarse únicamente con los atributos d de cada <path>
  const pathMatches = Array.from(content.matchAll(/<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/gi));
  const trazos = pathMatches.map((m) => m[1]);

  return { ancho, alto, trazos };
}

// 1. Extraer datos para cada una de las 6 categorías desde los SVGs originales
const datosExtraidos = {};
for (const [categoria, filename] of Object.entries(svgFiles)) {
  const filePath = path.join(svgDir, filename);
  datosExtraidos[categoria] = extraerDatosSvg(filePath);
}

// Validar cantidades esperadas según especificación
if (datosExtraidos.tecnologia.trazos.length !== 1) {
  throw new Error(`Tecnología debe tener 1 path, se encontraron ${datosExtraidos.tecnologia.trazos.length}`);
}
if (datosExtraidos.cosmetica.trazos.length !== 3) {
  throw new Error(`Cosmética debe tener 3 paths, se encontraron ${datosExtraidos.cosmetica.trazos.length}`);
}
if (datosExtraidos.entretenimiento.trazos.length !== 2) {
  throw new Error(`Entretenimiento debe tener 2 paths, se encontraron ${datosExtraidos.entretenimiento.trazos.length}`);
}
if (datosExtraidos.gastronomia.trazos.length !== 1) {
  throw new Error(`Gastronomía debe tener 1 path, se encontraron ${datosExtraidos.gastronomia.trazos.length}`);
}
if (datosExtraidos.indumentaria.trazos.length !== 1) {
  throw new Error(`Indumentaria debe tener 1 path, se encontraron ${datosExtraidos.indumentaria.trazos.length}`);
}
if (datosExtraidos.musica.trazos.length !== 1) {
  throw new Error(`Música debe tener 1 path, se encontraron ${datosExtraidos.musica.trazos.length}`);
}

// 2. Formatear contenido del archivo TypeScript
const header = `import type { CategoriaSobre } from '../../../modelos/categoria.model';

export const ORIGEN_ICONO_CATEGORIA: Record<CategoriaSobre, string> = {
  tecnologia: 'Icon_TecnoInv.svg',
  cosmetica: 'Icon_CosmeInv.svg',
  entretenimiento: 'Icon_EntretenimientoInv.svg',
  gastronomia: 'Icon_GastroInv.svg',
  indumentaria: 'Icon_IndumentariaInv.svg',
  musica: 'Icon_MusicaINV.svg',
};

export interface IconoCategoria {
  readonly ancho: number;
  readonly alto: number;
  readonly trazos: readonly string[];
}

export const ICONOS_CATEGORIA: Record<CategoriaSobre, IconoCategoria> = {
`;

let body = '';
for (const [categoria, data] of Object.entries(datosExtraidos)) {
  body += `  ${categoria}: {\n`;
  body += `    ancho: ${data.ancho},\n`;
  body += `    alto: ${data.alto},\n`;
  body += `    trazos: [\n`;
  for (const trazo of data.trazos) {
    body += `      '${trazo}',\n`;
  }
  body += `    ],\n`;
  body += `  },\n`;
}

const footer = `};\n`;

const fullTsContent = header + body + footer;
fs.writeFileSync(targetFile, fullTsContent, 'utf8');
console.log(`ICONOS_CATEGORIA regenerado exitosamente en: ${targetFile}`);

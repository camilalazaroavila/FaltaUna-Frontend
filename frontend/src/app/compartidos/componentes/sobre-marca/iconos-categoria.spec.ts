import * as fs from 'fs';
import * as path from 'path';
import type { CategoriaSobre } from '../../../modelos/categoria.model';
import { CATEGORIAS_SOBRE } from '../../../modelos/categoria.model';
import { ICONOS_CATEGORIA, ORIGEN_ICONO_CATEGORIA } from './iconos-categoria';

describe('ICONOS_CATEGORIA vs SVG originales', () => {
  const resolverRutaSvgs = (): string => {
    const posiblesRutas = [
      path.resolve(__dirname, '../../SVGs'),
      path.resolve(process.cwd(), 'src/app/compartidos/SVGs'),
      path.resolve(process.cwd(), 'frontend/src/app/compartidos/SVGs'),
    ];
    for (const ruta of posiblesRutas) {
      if (fs.existsSync(ruta)) {
        return ruta;
      }
    }
    throw new Error('No se encontró el directorio de SVGs originales.');
  };

  const carpetaSvgs = resolverRutaSvgs();

  CATEGORIAS_SOBRE.forEach((categoria: CategoriaSobre) => {
    describe(`Categoría: ${categoria}`, () => {
      it(`Dado el archivo SVG original ${ORIGEN_ICONO_CATEGORIA[categoria]}, Cuando se leen sus datos y se comparan con ICONOS_CATEGORIA, Entonces el viewBox, la cantidad de paths y el contenido exacto de cada d coinciden`, () => {
        const nombreArchivo = ORIGEN_ICONO_CATEGORIA[categoria];
        const rutaSvg = path.join(carpetaSvgs, nombreArchivo);
        const contenido = fs.readFileSync(rutaSvg, 'utf8');

        // Extraer viewBox
        const matchViewBox = contenido.match(/viewBox=["']([^"']+)["']/i);
        expect(matchViewBox).not.toBeNull();
        const [, viewBox] = matchViewBox as RegExpMatchArray;
        const [, , anchoStr, altoStr] = viewBox.trim().split(/\s+/);
        const anchoEsperado = parseFloat(anchoStr);
        const altoEsperado = parseFloat(altoStr);

        const icono = ICONOS_CATEGORIA[categoria];

        // Entonces el viewBox coincide
        expect(icono.ancho).toBeCloseTo(anchoEsperado, 4);
        expect(icono.alto).toBeCloseTo(altoEsperado, 4);

        // Extraer paths descartando <g>
        const pathsEncontrados = Array.from(
          contenido.matchAll(/<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/gi)
        ).map((m) => m[1]);

        // Entonces la cantidad de paths coincide
        expect(icono.trazos.length).toBe(pathsEncontrados.length);

        // Entonces el contenido exacto de cada 'd' coincide exactamente
        pathsEncontrados.forEach((d, index) => {
          expect(icono.trazos[index]).toBe(d);
        });
      });
    });
  });
});

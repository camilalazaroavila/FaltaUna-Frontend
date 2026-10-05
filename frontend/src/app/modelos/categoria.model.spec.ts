import {
  CATEGORIAS_SOBRE,
  ETIQUETAS_CATEGORIA,
  NOMBRES_CATEGORIA_BACKEND,
  categoriaDesdeNombre,
} from './categoria.model';
import type { CategoriaSobre } from './categoria.model';

describe('categoriaDesdeNombre', () => {
  describe('los nombres que el backend siembra hoy', () => {
    it('Dado el nombre "Comida" del backend, When se traduce, Then devuelve la categoría gastronomía', () => {
      // Given: la primera de las dos filas de `database/seeds/01_catalogo.sql`.
      // When
      const resultado = categoriaDesdeNombre('Comida');

      // Then: el nombre del sobre es "Gastronomía", no "Comida".
      expect(resultado).toBe('gastronomia');
      expect(ETIQUETAS_CATEGORIA[resultado as CategoriaSobre]).toBe('Gastronomía');
    });

    it('Dado el nombre "Ropa" del backend, When se traduce, Then devuelve la categoría indumentaria', () => {
      // Given: la segunda fila de la semilla.
      // When
      const resultado = categoriaDesdeNombre('Ropa');

      // Then
      expect(resultado).toBe('indumentaria');
      expect(ETIQUETAS_CATEGORIA[resultado as CategoriaSobre]).toBe('Indumentaria');
    });
  });

  it('Dado cada alias registrado, When se traduce, Then devuelve la categoría esperada', () => {
    // Given: la tabla completa, recorrida de a una para que un alias mal puesto
    // falle nombrando el valor y no el hash de un objeto.
    const esperados: Record<string, CategoriaSobre> = {
      comida: 'gastronomia',
      alimentos: 'gastronomia',
      bebida: 'gastronomia',
      bebidas: 'gastronomia',
      gastronomia: 'gastronomia',
      gastronomico: 'gastronomia',
      restaurante: 'gastronomia',
      ropa: 'indumentaria',
      moda: 'indumentaria',
      vestimenta: 'indumentaria',
      ropa_deportes: 'indumentaria',
      indumentaria: 'indumentaria',
      tecno: 'tecnologia',
      tecnologia: 'tecnologia',
      tecnologias: 'tecnologia',
      electronica: 'tecnologia',
      electrodomesticos: 'tecnologia',
      cosmetica: 'cosmetica',
      cosmeticos: 'cosmetica',
      belleza: 'cosmetica',
      cuidado_personal: 'cosmetica',
      entretenimiento: 'entretenimiento',
      entretenimientos: 'entretenimiento',
      musica: 'musica',
    };

    // When / Then
    for (const [alias, esperado] of Object.entries(esperados)) {
      expect(categoriaDesdeNombre(alias)).toBe(esperado);
    }

    // Y la tabla no tiene Aliases que el test no haya cubierto.
    expect(Object.keys(NOMBRES_CATEGORIA_BACKEND).sort()).toEqual(
      Object.keys(esperados).sort(),
    );
  });

  it('Dado un nombre con tildes, mayúsculas o espacios, When se traduce, Then se normaliza y resuelve igual', () => {
    // Given: `categoria.Nombre` es `varchar(50)` en `utf8mb4`: cualquiera de
    // estas cuatro filas es la misma categoría.
    // When / Then
    for (const variante of ['Cosmética', 'COSMETICA', 'cosmetica', '  cosmetica  ']) {
      expect(categoriaDesdeNombre(variante)).toBe('cosmetica');
    }

    expect(categoriaDesdeNombre('Gastronomía')).toBe('gastronomia');
    expect(categoriaDesdeNombre('Entretenimiento')).toBe('entretenimiento');
    expect(categoriaDesdeNombre('Música')).toBe('musica');
    expect(categoriaDesdeNombre('Tecnología')).toBe('tecnologia');
    expect(categoriaDesdeNombre('Indumentaria')).toBe('indumentaria');
  });

  describe('nombres que no existen en el catálogo', () => {
    it('Dado un nombre desconocido, When se traduce, Then devuelve null en vez de adivinar', () => {
      // Given: `categoria` es texto libre en la base, así que puede llegar
      // cualquier cosa y no hay enum que la frene.
      // When / Then
      for (const desconocido of ['Deuda', 'Hogar', 'Deco', 'autodeportes', 'x', '123', '--']) {
        expect(categoriaDesdeNombre(desconocido)).toBeNull();
      }
    });

    it('Dado un nombre vacío o ausente, When se traduce, Then devuelve null para que caiga al sobre genérico', () => {
      // Given / When / Then
      expect(categoriaDesdeNombre('')).toBeNull();
      expect(categoriaDesdeNombre('   ')).toBeNull();
      expect(categoriaDesdeNombre(null)).toBeNull();
      expect(categoriaDesdeNombre(undefined)).toBeNull();
    });

    it('Dado un nombre que no es texto, When se traduce, Then no lanza y devuelve null', () => {
      // Given: un backend que cambió de tipo a mitad de camino no debe romper
      // el render del sobre.
      // When / Then
      expect(categoriaDesdeNombre(42 as unknown as string)).toBeNull();
      expect(categoriaDesdeNombre({} as unknown as string)).toBeNull();
    });
  });

  describe('coherencia del catálogo', () => {
    it('Dado el catálogo de categorías, When se recorre, Then cada valor tiene etiqueta', () => {
      // Given / When
      const sinEtiqueta = CATEGORIAS_SOBRE.filter((c) => !ETIQUETAS_CATEGORIA[c]);

      // Then
      expect(sinEtiqueta).toEqual([]);
    });

    it('Dado el catálogo de categorías, When se recorre, Then cada valor es alcanzable desde un nombre del backend', () => {
      // Given / When: una categoría que ningún `Nombre` produce es una categoría
      // que el sobre nunca va a poder pintar, porque su `input` es un string.
      const valoresAlcanzables = new Set(Object.values(NOMBRES_CATEGORIA_BACKEND));

      // Then
      expect([...valoresAlcanzables].sort()).toEqual([...CATEGORIAS_SOBRE].sort());
    });

    it('Dado el catálogo de categorías, When se busca el nombre que las nombra, Then cada una se traduce a sí misma', () => {
      // Given / When: `categoriaDesdeNombre(ETIQUETAS_CATEGORIA[c])` es el camino
      // que va a usar el padre cuando el backend ya traiga el nombre final. Sin
      // esta vuelta, `Indumentaria` se caía al sobre genérico: la tabla tenía
      // `Ropa`, `Moda` y `Vestimenta` pero no su propio nombre.
      const fallidos = CATEGORIAS_SOBRE.filter(
        (c) => categoriaDesdeNombre(ETIQUETAS_CATEGORIA[c]) !== c,
      );

      // Then
      expect(fallidos).toEqual([]);
    });

    it('Dado el catálogo de categorías, When se lee, Then los valores son identificadores sin tildes ni espacios', () => {
      // Given / When
      const sospechoso = CATEGORIAS_SOBRE.filter((c) => !/^[a-z]+$/.test(c));

      // Then: son valores de máquina, van a un input y a un atributo de datos.
      expect(sospechoso).toEqual([]);
    });
  });
});

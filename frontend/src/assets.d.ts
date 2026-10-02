/**
 * Tipos de modulo para los SVG de `compartidos/SVGs`.
 *
 * Sin esta declaracion, `import logo from './logo.svg'` falla bajo `strict`.
 * El bundler de Angular (@angular/build) resuelve el import como URL y emite el
 * archivo al directorio de salida, con hash y sin copiar el arbol completo.
 */
declare module '*.svg' {
  const url: string;
  export default url;
}
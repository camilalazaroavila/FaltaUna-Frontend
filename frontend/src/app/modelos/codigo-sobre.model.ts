/** Respuesta cruda de POST /CodigosSobre/generar (rol Empleado). */
export interface CodigoSobreApi {
    marca: string;
    sobre: string;
    codigo: string;
    qrToken: string;
    /** Imagen del QR ya armada por el servidor: data:image/png;base64,... */
    qrDataUrl: string;
    fechaVencimiento: string;
    segundosRestantes: number;
}

/** Código de sobre listo para mostrarle al empleado. */
export interface CodigoSobreGenerado {
    marca: string;
    sobre: string;
    /** Código corto para dictar o tipear, por ejemplo K7MD-4XQ9. */
    codigo: string;
    /** Se usa directo como `src` de un <img>. */
    qrDataUrl: string;
    vencimientoUtc: string;
    duracionSegundos: number;
}

/** Cuerpo de POST /CodigosSobre/canjear. Acepta el contenido del QR o el código corto. */
export interface CanjearCodigoSobreSolicitud {
    codigo: string;
}

/** Respuesta de POST /CodigosSobre/canjear (rol Usuario). */
export interface CanjeCodigoSobreRespuesta {
    mensaje: string;
    marca: string;
    sobreId: number;
    sobre: string;
}
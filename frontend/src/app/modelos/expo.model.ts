export interface ConfiguracionExpo {
  sobreRegaloId: number | null;
  activo: boolean;
}

/** Ajustalo a lo que devuelva tu GET /api/Sobres */
export interface SobreResumen {
  id: number;
  nombre?: string;
  marcaNombre?: string;
}

export interface UsuarioResumen {
  id: number;
  nombreUsuario: string;
  email: string;
  rol: string;
  fechaRegistro: string;
  avatarUrl?: string | null;
}

export interface EntregaSobre {
  mensaje: string;
  usuarioId: number;
  sobreId: number;
  cantidadAgregada: number;
  cantidadActual: number;
}

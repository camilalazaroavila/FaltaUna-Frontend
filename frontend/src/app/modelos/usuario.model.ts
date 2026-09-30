export interface Usuario {
  id: number;
  nombreUsuario: string;
  email: string;
  fechaRegistro: string;
  oro: number;
  monedasIntercambio: number;
}

export interface CrearUsuarioSolicitud {
  nombreUsuario: string;
  email: string;
  password: string;
  rol: string;
}

export interface UsuarioRespuesta {
  id: number;
  nombreUsuario: string;
  email: string;
  rol: string;
  fechaRegistro: string;
  oro: number;
  monedasIntercambio: number;
}

export interface DisponibilidadRespuesta {
  nombreUsuarioDisponible: boolean | null;
  emailDisponible: boolean | null;
}

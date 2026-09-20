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
  password?: string;
  passwordHash?: string;
}

export interface UsuarioRespuesta {
  id: number;
  nombreUsuario: string;
  email: string;
  fechaRegistro: string;
  oro: number;
  monedasIntercambio: number;
}

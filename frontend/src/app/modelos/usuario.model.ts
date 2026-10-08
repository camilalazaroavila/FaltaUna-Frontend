export type Rol = 'Usuario' | 'Empleado' | 'Empresa' | 'Admin';

export interface Usuario {
  id: number;
  nombreUsuario: string;
  email: string;
  rol: Rol;
  fechaRegistro: string;
  oro: number;
  monedasIntercambio: number;
}

export interface UsuarioRespuesta {
  id: number;
  nombreUsuario: string;
  email: string;
  rol: Rol;
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


export interface DisponibilidadRespuesta {
  nombreUsuarioDisponible: boolean | null;
  emailDisponible: boolean | null;
}


export interface LoginSolicitud {
  identificador: string;
  password: string;
}

export interface LoginRespuesta {
  token: string;
  expiraUtc: string;
  usuario: UsuarioRespuesta;
}

//prueba

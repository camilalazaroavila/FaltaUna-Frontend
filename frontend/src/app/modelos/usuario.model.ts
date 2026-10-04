export type Rol = 'Usuario' | 'Empleado' | 'Empresa' | 'Admin';

/** Roles que se pueden elegir al registrarse. Admin nunca se ofrece acá. */
export const ROLES_REGISTRABLES: { valor: Rol; etiqueta: string }[] = [
  { valor: 'Usuario', etiqueta: 'Usuario' },
  { valor: 'Empleado', etiqueta: 'Empleado' },
  { valor: 'Empresa', etiqueta: 'Empresa' }
];

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

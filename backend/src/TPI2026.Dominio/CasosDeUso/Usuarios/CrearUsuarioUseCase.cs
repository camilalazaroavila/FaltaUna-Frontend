using TPI2026.Dominio.Entidades;
using TPI2026.Dominio.Excepciones;
using TPI2026.Dominio.Proveedores;
using TPI2026.Dominio.Repositorios;

namespace TPI2026.Dominio.CasosDeUso.Usuarios;

public class CrearUsuarioUseCase
{
    private readonly IUsuarioRepositorio _usuarioRepositorio;
    private readonly IHasheadorContrasenia _hasheadorContrasenia;

    public CrearUsuarioUseCase(IUsuarioRepositorio usuarioRepositorio, IHasheadorContrasenia hasheadorContrasenia)
    {
        _usuarioRepositorio = usuarioRepositorio;
        _hasheadorContrasenia = hasheadorContrasenia;
    }

    public async Task<Usuario> EjecutarAsync(string nombreUsuario, string email, string passwordPlana)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario))
            throw new DominioException("El nombre de usuario es requerido.");

        if (string.IsNullOrWhiteSpace(email))
            throw new DominioException("El email es requerido.");

        if (string.IsNullOrWhiteSpace(passwordPlana))
            throw new DominioException("La contraseña es requerida.");

        var existentePorNombre = await _usuarioRepositorio.ObtenerPorNombreUsuarioAsync(nombreUsuario);
        if (existentePorNombre != null)
            throw new DominioException("El nombre de usuario ya se encuentra en uso.");

        var existentePorEmail = await _usuarioRepositorio.ObtenerPorEmailAsync(email);
        if (existentePorEmail != null)
            throw new DominioException("El email ya se encuentra en uso.");

        // Variable local en camelCase (p minúscula)
        var passwordHash = _hasheadorContrasenia.Hashear(passwordPlana);

        var nuevoUsuario = new Usuario
        {
            NombreUsuario = nombreUsuario.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash, // <--- Propiedad en PascalCase (P mayúscula) = variable local (p minúscula)
            FechaRegistro = DateTime.UtcNow,
            Oro = 0,
            MonedasIntercambio = 0
        };

        await _usuarioRepositorio.AgregarAsync(nuevoUsuario);
        await _usuarioRepositorio.GuardarCambiosAsync();

        return nuevoUsuario;
    }
}
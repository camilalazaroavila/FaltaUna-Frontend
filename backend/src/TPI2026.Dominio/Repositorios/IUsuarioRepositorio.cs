using TPI2026.Dominio.Entidades;

namespace TPI2026.Dominio.Repositorios;

public interface IUsuarioRepositorio
{
    Task<Usuario?> ObtenerPorIdAsync(int id);
    Task<Usuario?> ObtenerPorEmailAsync(string email);
    Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario);
    Task<IEnumerable<Usuario>> ObtenerTodosAsync();
    Task AgregarAsync(Usuario usuario);
    Task GuardarCambiosAsync();
}

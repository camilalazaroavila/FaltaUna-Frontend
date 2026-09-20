using TPI2026.Dominio.Entidades;
using TPI2026.Dominio.Repositorios;

namespace TPI2026.Dominio.CasosDeUso.Usuarios;

public class ObtenerUsuariosUseCase
{
    private readonly IUsuarioRepositorio _usuarioRepositorio;

    public ObtenerUsuariosUseCase(IUsuarioRepositorio usuarioRepositorio)
    {
        _usuarioRepositorio = usuarioRepositorio;
    }

    public async Task<IEnumerable<Usuario>> EjecutarAsync()
    {
        return await _usuarioRepositorio.ObtenerTodosAsync();
    }
}

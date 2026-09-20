using TPI2026.Dominio.CasosDeUso.Usuarios;
using TPI2026.Dominio.Entidades;
using TPI2026.Dominio.Excepciones;
using TPI2026.Dominio.Proveedores;
using TPI2026.Dominio.Repositorios;
using Xunit;

namespace TPI2026.Tests.Logica.CasosDeUso;

public class CrearUsuarioUseCaseTests
{
    private class FakeUsuarioRepositorio : IUsuarioRepositorio
    {
        public List<Usuario> Usuarios = new();

        public Task<Usuario?> ObtenerPorIdAsync(int id) => Task.FromResult(Usuarios.FirstOrDefault(u => u.Id == id));
        public Task<Usuario?> ObtenerPorEmailAsync(string email) => Task.FromResult(Usuarios.FirstOrDefault(u => u.Email == email));
        public Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario) => Task.FromResult(Usuarios.FirstOrDefault(u => u.NombreUsuario == nombreUsuario));
        public Task<IEnumerable<Usuario>> ObtenerTodosAsync() => Task.FromResult<IEnumerable<Usuario>>(Usuarios);
        public Task AgregarAsync(Usuario usuario)
        {
            usuario.Id = Usuarios.Count + 1;
            Usuarios.Add(usuario);
            return Task.CompletedTask;
        }
        public Task GuardarCambiosAsync() => Task.CompletedTask;
    }

    private class FakeHasheadorContrasenia : IHasheadorContrasenia
    {
        public string Hashear(string contrasenia) => $"hashed_{contrasenia}";
        public bool Verificar(string contrasenia, string hash) => hash == $"hashed_{contrasenia}";
    }

    [Fact]
    public async Task EjecutarAsync_DatosValidos_CreaUsuarioConContraseniaHasheada()
    {
        var repo = new FakeUsuarioRepositorio();
        var hasheador = new FakeHasheadorContrasenia();
        var useCase = new CrearUsuarioUseCase(repo, hasheador);

        var usuario = await useCase.EjecutarAsync("testuser", "test@example.com", "secret123");

        Assert.NotNull(usuario);
        Assert.Equal("testuser", usuario.NombreUsuario);
        Assert.Equal("test@example.com", usuario.Email);
        Assert.Equal("hashed_secret123", usuario.PasswordHash);
    }

    [Fact]
    public async Task EjecutarAsync_UsuarioDuplicado_LanzaDominioException()
    {
        var repo = new FakeUsuarioRepositorio();
        var hasheador = new FakeHasheadorContrasenia();
        var useCase = new CrearUsuarioUseCase(repo, hasheador);

        await useCase.EjecutarAsync("testuser", "test@example.com", "secret123");

        await Assert.ThrowsAsync<DominioException>(() =>
            useCase.EjecutarAsync("testuser", "otro@example.com", "secret123")
        );
    }
}

using Microsoft.AspNetCore.Mvc;
using TPI2026.API.Controladores;
using TPI2026.API.DTOs.Respuestas;
using TPI2026.API.DTOs.Solicitudes;
using TPI2026.Dominio.CasosDeUso.Usuarios;
using TPI2026.Dominio.Entidades;
using TPI2026.Dominio.Proveedores;
using TPI2026.Dominio.Repositorios;
using Xunit;

namespace TPI2026.Tests.API.Controladores;

public class UsuariosControllerTests
{
    private class InMemoryUsuarioRepo : IUsuarioRepositorio
    {
        public List<Usuario> Lista = new();
        public Task<Usuario?> ObtenerPorIdAsync(int id) => Task.FromResult(Lista.FirstOrDefault(u => u.Id == id));
        public Task<Usuario?> ObtenerPorEmailAsync(string email) => Task.FromResult(Lista.FirstOrDefault(u => u.Email == email));
        public Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario) => Task.FromResult(Lista.FirstOrDefault(u => u.NombreUsuario == nombreUsuario));
        public Task<IEnumerable<Usuario>> ObtenerTodosAsync() => Task.FromResult<IEnumerable<Usuario>>(Lista);
        public Task AgregarAsync(Usuario usuario)
        {
            usuario.Id = Lista.Count + 1;
            Lista.Add(usuario);
            return Task.CompletedTask;
        }
        public Task GuardarCambiosAsync() => Task.CompletedTask;
    }

    private class DummyHasheador : IHasheadorContrasenia
    {
        public string Hashear(string contrasenia) => $"hash_{contrasenia}";
        public bool Verificar(string contrasenia, string hash) => hash == $"hash_{contrasenia}";
    }

    [Fact]
    public async Task CrearUsuario_RetornaCreatedAtAction()
    {
        var repo = new InMemoryUsuarioRepo();
        var hasheador = new DummyHasheador();
        var getUseCase = new ObtenerUsuariosUseCase(repo);
        var createUseCase = new CrearUsuarioUseCase(repo, hasheador);
        var controller = new UsuariosController(getUseCase, createUseCase);

        var solicitud = new CrearUsuarioSolicitud("jugador1", "jugador1@test.com", "clave123");
        var resultado = await controller.CrearUsuario(solicitud);

        var createdAt = Assert.IsType<CreatedAtActionResult>(resultado.Result);
        var respuesta = Assert.IsType<UsuarioRespuesta>(createdAt.Value);
        Assert.Equal("jugador1", respuesta.NombreUsuario);
        Assert.Equal("jugador1@test.com", respuesta.Email);
    }
}

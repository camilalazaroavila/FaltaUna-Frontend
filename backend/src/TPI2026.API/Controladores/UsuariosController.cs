using Microsoft.AspNetCore.Mvc;
using TPI2026.API.DTOs.Respuestas;
using TPI2026.API.DTOs.Solicitudes;
using TPI2026.Dominio.CasosDeUso.Usuarios;

namespace TPI2026.API.Controladores;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly ObtenerUsuariosUseCase _obtenerUsuariosUseCase;
    private readonly CrearUsuarioUseCase _crearUsuarioUseCase;

    public UsuariosController(
        ObtenerUsuariosUseCase obtenerUsuariosUseCase,
        CrearUsuarioUseCase crearUsuarioUseCase)
    {
        _obtenerUsuariosUseCase = obtenerUsuariosUseCase;
        _crearUsuarioUseCase = crearUsuarioUseCase;
    }

    // GET: api/Usuarios
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioRespuesta>>> ObtenerUsuarios()
    {
        var usuarios = await _obtenerUsuariosUseCase.EjecutarAsync();
        var respuesta = usuarios.Select(u => new UsuarioRespuesta(
            u.Id,
            u.NombreUsuario,
            u.Email,
            u.FechaRegistro,
            u.Oro,
            u.MonedasIntercambio
        ));

        return Ok(respuesta);
    }

    // POST: api/Usuarios
    [HttpPost]
    public async Task<ActionResult<UsuarioRespuesta>> CrearUsuario([FromBody] CrearUsuarioSolicitud solicitud)
    {
        var usuarioCreado = await _crearUsuarioUseCase.EjecutarAsync(
            solicitud.NombreUsuario,
            solicitud.Email,
            solicitud.Password
        );

        var respuesta = new UsuarioRespuesta(
            usuarioCreado.Id,
            usuarioCreado.NombreUsuario,
            usuarioCreado.Email,
            usuarioCreado.FechaRegistro,
            usuarioCreado.Oro,
            usuarioCreado.MonedasIntercambio
        );

        return CreatedAtAction(nameof(ObtenerUsuarios), new { id = respuesta.Id }, respuesta);
    }
}
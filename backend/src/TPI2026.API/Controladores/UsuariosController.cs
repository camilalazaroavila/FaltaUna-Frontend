using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TPI2026.API.Infraestructura.Datos;

namespace TPI2026.API.Controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUsuarios()
        {
            var usuarios = await _context.Usuarios
                .ToListAsync();

            return Ok(usuarios);
        }
    }
}
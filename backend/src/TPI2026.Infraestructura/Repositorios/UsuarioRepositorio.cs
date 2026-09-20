using Microsoft.EntityFrameworkCore;
using TPI2026.Dominio.Entidades;
using TPI2026.Dominio.Repositorios;
using TPI2026.Infraestructura.Data;

namespace TPI2026.Infraestructura.Repositorios;

public class UsuarioRepositorio : IUsuarioRepositorio
{
    private readonly AppDbContext _context;

    public UsuarioRepositorio(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> ObtenerPorIdAsync(int id)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Usuario?> ObtenerPorEmailAsync(string email)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);
    }

    public async Task<IEnumerable<Usuario>> ObtenerTodosAsync()
    {
        return await _context.Usuarios
            .ToListAsync();
    }

    public async Task AgregarAsync(Usuario usuario)
    {
        await _context.Usuarios.AddAsync(usuario);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}

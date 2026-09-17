using Microsoft.EntityFrameworkCore;

namespace TPI2026.API.Infraestructura.Datos
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }
}
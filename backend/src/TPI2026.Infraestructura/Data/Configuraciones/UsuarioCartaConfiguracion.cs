using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class UsuarioCartaConfiguracion : IEntityTypeConfiguration<UsuarioCarta>
{
    public void Configure(EntityTypeBuilder<UsuarioCarta> builder)
    {
        builder.ToTable("usuariocarta");
        builder.HasKey(x => new { x.UsuarioId, x.CartaId });

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Carta)
            .WithMany(x => x.Usuarios)
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

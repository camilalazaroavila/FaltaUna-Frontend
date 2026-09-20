using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class IntercambioCartaConfiguracion : IEntityTypeConfiguration<IntercambioCarta>
{
    public void Configure(EntityTypeBuilder<IntercambioCarta> builder)
    {
        builder.ToTable("intercambiocarta");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Intercambio)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.IntercambioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Carta)
            .WithMany()
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

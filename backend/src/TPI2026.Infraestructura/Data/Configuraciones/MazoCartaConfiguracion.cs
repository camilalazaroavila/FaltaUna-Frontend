using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class MazoCartaConfiguracion : IEntityTypeConfiguration<MazoCarta>
{
    public void Configure(EntityTypeBuilder<MazoCarta> builder)
    {
        builder.ToTable("mazocarta");
        builder.HasKey(x => new { x.MazoId, x.CartaId });

        builder.HasOne(x => x.Mazo)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.MazoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Carta)
            .WithMany(x => x.Mazos)
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

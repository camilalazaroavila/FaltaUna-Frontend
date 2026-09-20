using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ColeccionCartaConfiguracion : IEntityTypeConfiguration<ColeccionCarta>
{
    public void Configure(EntityTypeBuilder<ColeccionCarta> builder)
    {
        builder.ToTable("coleccioncarta");
        builder.HasKey(x => new { x.ColeccionId, x.CartaId });

        builder.HasOne(x => x.Coleccion)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.ColeccionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Carta)
            .WithMany(x => x.Colecciones)
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

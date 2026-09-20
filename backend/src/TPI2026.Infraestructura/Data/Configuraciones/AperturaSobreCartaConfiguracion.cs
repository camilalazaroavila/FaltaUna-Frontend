using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class AperturaSobreCartaConfiguracion : IEntityTypeConfiguration<AperturaSobreCarta>
{
    public void Configure(EntityTypeBuilder<AperturaSobreCarta> builder)
    {
        builder.ToTable("aperturasobrecarta");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.AperturaSobre)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.AperturaSobreId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Carta)
            .WithMany(x => x.Aperturas)
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

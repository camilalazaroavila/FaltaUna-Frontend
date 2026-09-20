using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ZonaRondaConfiguracion : IEntityTypeConfiguration<ZonaRonda>
{
    public void Configure(EntityTypeBuilder<ZonaRonda> builder)
    {
        builder.ToTable("zonaronda");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Lado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(x => new { x.RondaId, x.ZonaPartidaId })
            .IsUnique();

        builder.HasOne(x => x.Ronda)
            .WithMany(x => x.Zonas)
            .HasForeignKey(x => x.RondaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ZonaPartida)
            .WithMany(x => x.Rondas)
            .HasForeignKey(x => x.ZonaPartidaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

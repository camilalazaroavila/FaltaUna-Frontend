using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ZonaPartidaConfiguracion : IEntityTypeConfiguration<ZonaPartida>
{
    public void Configure(EntityTypeBuilder<ZonaPartida> builder)
    {
        builder.ToTable("zonapartida");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PosicionInicial)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(x => new { x.PartidaId, x.ZonaId })
            .IsUnique();

        builder.HasOne(x => x.Partida)
            .WithMany(x => x.Zonas)
            .HasForeignKey(x => x.PartidaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Zona)
            .WithMany(x => x.Partidas)
            .HasForeignKey(x => x.ZonaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

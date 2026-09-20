using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ResultadoZonaConfiguracion : IEntityTypeConfiguration<ResultadoZona>
{
    public void Configure(EntityTypeBuilder<ResultadoZona> builder)
    {
        builder.ToTable("resultadozona");
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.RondaId, x.ZonaPartidaId })
            .IsUnique();

        builder.HasOne(x => x.Ronda)
            .WithMany(x => x.Resultados)
            .HasForeignKey(x => x.RondaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ZonaPartida)
            .WithMany(x => x.Resultados)
            .HasForeignKey(x => x.ZonaPartidaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

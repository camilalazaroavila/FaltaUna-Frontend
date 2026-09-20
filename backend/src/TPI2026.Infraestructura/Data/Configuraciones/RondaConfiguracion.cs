using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class RondaConfiguracion : IEntityTypeConfiguration<Ronda>
{
    public void Configure(EntityTypeBuilder<Ronda> builder)
    {
        builder.ToTable("ronda");
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.PartidaId, x.Numero })
            .IsUnique();

        builder.HasOne(x => x.Partida)
            .WithMany(x => x.Rondas)
            .HasForeignKey(x => x.PartidaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

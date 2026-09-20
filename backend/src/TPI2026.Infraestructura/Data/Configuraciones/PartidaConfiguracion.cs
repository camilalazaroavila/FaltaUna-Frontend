using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class PartidaConfiguracion : IEntityTypeConfiguration<Partida>
{
    public void Configure(EntityTypeBuilder<Partida> builder)
    {
        builder.ToTable("partida");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(x => x.Ganador)
            .WithMany()
            .HasForeignKey(x => x.GanadorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

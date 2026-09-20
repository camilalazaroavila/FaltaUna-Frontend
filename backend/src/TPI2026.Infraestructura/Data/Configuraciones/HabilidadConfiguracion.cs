using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class HabilidadConfiguracion : IEntityTypeConfiguration<Habilidad>
{
    public void Configure(EntityTypeBuilder<Habilidad> builder)
    {
        builder.ToTable("habilidad");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Tipo)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(x => x.CategoriaObjetivo)
            .WithMany(x => x.Habilidades)
            .HasForeignKey(x => x.CategoriaObjetivoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

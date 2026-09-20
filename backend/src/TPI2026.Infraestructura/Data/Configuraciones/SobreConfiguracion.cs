using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class SobreConfiguracion : IEntityTypeConfiguration<Sobre>
{
    public void Configure(EntityTypeBuilder<Sobre> builder)
    {
        builder.ToTable("sobre");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Tipo)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(x => x.Categoria)
            .WithMany()
            .HasForeignKey(x => x.CategoriaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Coleccion)
            .WithMany()
            .HasForeignKey(x => x.ColeccionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

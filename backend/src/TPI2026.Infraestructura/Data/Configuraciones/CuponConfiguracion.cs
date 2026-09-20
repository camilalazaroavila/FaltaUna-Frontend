using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class CuponConfiguracion : IEntityTypeConfiguration<Cupon>
{
    public void Configure(EntityTypeBuilder<Cupon> builder)
    {
        builder.ToTable("cupon");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Codigo)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(x => x.Codigo)
            .IsUnique();

        builder.HasOne(x => x.Coleccion)
            .WithMany(x => x.Cupones)
            .HasForeignKey(x => x.ColeccionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

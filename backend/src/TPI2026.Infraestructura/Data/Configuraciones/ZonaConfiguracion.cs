using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ZonaConfiguracion : IEntityTypeConfiguration<Zona>
{
    public void Configure(EntityTypeBuilder<Zona> builder)
    {
        builder.ToTable("zona");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ColeccionConfiguracion : IEntityTypeConfiguration<Coleccion>
{
    public void Configure(EntityTypeBuilder<Coleccion> builder)
    {
        builder.ToTable("coleccion");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.ImagenUrl)
            .HasMaxLength(500);
    }
}

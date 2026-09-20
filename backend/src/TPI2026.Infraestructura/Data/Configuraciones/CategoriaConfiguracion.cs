using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class CategoriaConfiguracion : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.ToTable("categoria");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(50);
    }
}

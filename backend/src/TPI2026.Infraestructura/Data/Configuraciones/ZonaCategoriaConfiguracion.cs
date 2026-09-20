using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class ZonaCategoriaConfiguracion : IEntityTypeConfiguration<ZonaCategoria>
{
    public void Configure(EntityTypeBuilder<ZonaCategoria> builder)
    {
        builder.ToTable("zonacategoria");
        builder.HasKey(x => new { x.ZonaId, x.CategoriaId });

        builder.HasOne(x => x.Zona)
            .WithMany(x => x.Categorias)
            .HasForeignKey(x => x.ZonaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Categoria)
            .WithMany(x => x.Zonas)
            .HasForeignKey(x => x.CategoriaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

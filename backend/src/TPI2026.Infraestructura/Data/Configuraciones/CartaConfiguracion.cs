using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class CartaConfiguracion : IEntityTypeConfiguration<Carta>
{
    public void Configure(EntityTypeBuilder<Carta> builder)
    {
        builder.ToTable("carta");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Rareza)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.ImagenUrl)
            .HasMaxLength(500);

        builder.HasOne(x => x.Habilidad)
            .WithOne(x => x.Carta)
            .HasForeignKey<Habilidad>(x => x.CartaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Categoria)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

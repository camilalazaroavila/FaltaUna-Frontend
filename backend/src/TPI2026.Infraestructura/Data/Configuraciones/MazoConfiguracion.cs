using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class MazoConfiguracion : IEntityTypeConfiguration<Mazo>
{
    public void Configure(EntityTypeBuilder<Mazo> builder)
    {
        builder.ToTable("mazo");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Mazos)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class UsuarioCuponConfiguracion : IEntityTypeConfiguration<UsuarioCupon>
{
    public void Configure(EntityTypeBuilder<UsuarioCupon> builder)
    {
        builder.ToTable("usuariocupon");
        builder.HasKey(x => new { x.UsuarioId, x.CuponId });

        builder.Property(x => x.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Cupones)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Cupon)
            .WithMany(x => x.Usuarios)
            .HasForeignKey(x => x.CuponId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class UsuarioConfiguracion : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuario");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.NombreUsuario)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(x => x.NombreUsuario)
            .IsUnique();

        builder.HasIndex(x => x.Email)
            .IsUnique();

        builder.Property(x => x.FechaRegistro)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAdd();

        builder.Property(x => x.Oro)
            .HasDefaultValue(0);

        builder.Property(x => x.MonedasIntercambio)
            .HasDefaultValue(0);
    }
}

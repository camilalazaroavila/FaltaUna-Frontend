using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class AperturaSobreConfiguracion : IEntityTypeConfiguration<AperturaSobre>
{
    public void Configure(EntityTypeBuilder<AperturaSobre> builder)
    {
        builder.ToTable("aperturasobre");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Sobre)
            .WithMany(x => x.Aperturas)
            .HasForeignKey(x => x.SobreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

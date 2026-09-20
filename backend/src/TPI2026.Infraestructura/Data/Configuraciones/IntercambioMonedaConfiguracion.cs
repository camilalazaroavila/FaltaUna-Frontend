using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class IntercambioMonedaConfiguracion : IEntityTypeConfiguration<IntercambioMoneda>
{
    public void Configure(EntityTypeBuilder<IntercambioMoneda> builder)
    {
        builder.ToTable("intercambiomoneda");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Intercambio)
            .WithMany(x => x.Monedas)
            .HasForeignKey(x => x.IntercambioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

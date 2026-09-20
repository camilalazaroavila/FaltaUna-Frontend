using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class CartaPartidaConfiguracion : IEntityTypeConfiguration<CartaPartida>
{
    public void Configure(EntityTypeBuilder<CartaPartida> builder)
    {
        builder.ToTable("cartapartida");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(x => x.JugadorPartida)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.JugadorPartidaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Carta)
            .WithMany(x => x.CartasPartida)
            .HasForeignKey(x => x.CartaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Ronda)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.RondaId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.ZonaPartida)
            .WithMany(x => x.Cartas)
            .HasForeignKey(x => x.ZonaPartidaId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

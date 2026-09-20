using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class JugadorPartidaConfiguracion : IEntityTypeConfiguration<JugadorPartida>
{
    public void Configure(EntityTypeBuilder<JugadorPartida> builder)
    {
        builder.ToTable("jugadorpartida");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Partida)
            .WithMany(x => x.Jugadores)
            .HasForeignKey(x => x.PartidaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Partidas)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Mazo)
            .WithMany(x => x.Partidas)
            .HasForeignKey(x => x.MazoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

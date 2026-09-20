using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data.Configuraciones;

public class MatchmakingConfiguracion : IEntityTypeConfiguration<Matchmaking>
{
    public void Configure(EntityTypeBuilder<Matchmaking> builder)
    {
        builder.ToTable("matchmaking");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(x => x.Usuario)
            .WithMany(x => x.Matchmakings)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Mazo)
            .WithMany(x => x.Matchmakings)
            .HasForeignKey(x => x.MazoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

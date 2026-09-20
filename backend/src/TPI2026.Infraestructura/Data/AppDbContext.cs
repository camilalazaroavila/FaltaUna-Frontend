using Microsoft.EntityFrameworkCore;
using TPI2026.Dominio.Entidades;

namespace TPI2026.Infraestructura.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Carta> Cartas => Set<Carta>();
    public DbSet<UsuarioCarta> UsuariosCartas => Set<UsuarioCarta>();
    public DbSet<Coleccion> Colecciones => Set<Coleccion>();
    public DbSet<ColeccionCarta> ColeccionesCartas => Set<ColeccionCarta>();
    public DbSet<Habilidad> Habilidades => Set<Habilidad>();
    public DbSet<Cupon> Cupones => Set<Cupon>();
    public DbSet<UsuarioCupon> UsuariosCupones => Set<UsuarioCupon>();
    public DbSet<Sobre> Sobres => Set<Sobre>();
    public DbSet<AperturaSobre> AperturasSobre => Set<AperturaSobre>();
    public DbSet<AperturaSobreCarta> AperturasSobreCartas => Set<AperturaSobreCarta>();
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<ZonaCategoria> ZonasCategorias => Set<ZonaCategoria>();
    public DbSet<Mazo> Mazos => Set<Mazo>();
    public DbSet<MazoCarta> MazosCartas => Set<MazoCarta>();
    public DbSet<Partida> Partidas => Set<Partida>();
    public DbSet<JugadorPartida> JugadoresPartida => Set<JugadorPartida>();
    public DbSet<Ronda> Rondas => Set<Ronda>();
    public DbSet<ZonaPartida> ZonasPartida => Set<ZonaPartida>();
    public DbSet<ZonaRonda> ZonasRonda => Set<ZonaRonda>();
    public DbSet<CartaPartida> CartasPartida => Set<CartaPartida>();
    public DbSet<ResultadoZona> ResultadosZona => Set<ResultadoZona>();
    public DbSet<Matchmaking> Matchmakings => Set<Matchmaking>();
    public DbSet<Intercambio> Intercambios => Set<Intercambio>();
    public DbSet<IntercambioCarta> IntercambiosCartas => Set<IntercambioCarta>();
    public DbSet<IntercambioMoneda> IntercambiosMonedas => Set<IntercambioMoneda>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

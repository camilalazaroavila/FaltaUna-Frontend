using Microsoft.EntityFrameworkCore;

namespace TPI2026.API.Infraestructura.Datos
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // ============================================================
        // TABLAS
        // ============================================================

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

            // ========================================================
            // CLAVES COMPUESTAS
            // ========================================================

            modelBuilder.Entity<UsuarioCarta>()
                .HasKey(x => new { x.UsuarioId, x.CartaId });

            modelBuilder.Entity<ColeccionCarta>()
                .HasKey(x => new { x.ColeccionId, x.CartaId });

            modelBuilder.Entity<UsuarioCupon>()
                .HasKey(x => new { x.UsuarioId, x.CuponId });

            modelBuilder.Entity<ZonaCategoria>()
                .HasKey(x => new { x.ZonaId, x.CategoriaId });

            modelBuilder.Entity<MazoCarta>()
                .HasKey(x => new { x.MazoId, x.CartaId });


            // ========================================================
            // UNIQUE
            // ========================================================

            modelBuilder.Entity<Usuario>()
                .HasIndex(x => x.NombreUsuario)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasIndex(x => x.Email)
                .IsUnique();

            modelBuilder.Entity<Carta>()
                .HasOne(x => x.Habilidad)
                .WithOne(x => x.Carta)
                .HasForeignKey<Habilidad>(x => x.CartaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cupon>()
                .HasIndex(x => x.Codigo)
                .IsUnique();

            // ============================================================
            // VALORES POR DEFECTO DE USUARIO
            // ============================================================
            modelBuilder.Entity<Usuario>()
                .Property(x => x.FechaRegistro)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<Usuario>()
                .Property(x => x.Oro)
                .HasDefaultValue(0);

            modelBuilder.Entity<Usuario>()
                .Property(x => x.MonedasIntercambio)
                .HasDefaultValue(0);
            
            // ========================================================
            // USUARIO -> CARTAS
            // ========================================================

            modelBuilder.Entity<UsuarioCarta>()
                .HasOne(x => x.Usuario)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UsuarioCarta>()
                .HasOne(x => x.Carta)
                .WithMany(x => x.Usuarios)
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Cascade);


            // ========================================================
            // CARTA -> CATEGORIA
            // ========================================================

            modelBuilder.Entity<Carta>()
                .HasOne(x => x.Categoria)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // COLECCION -> CARTAS
            // ========================================================

            modelBuilder.Entity<ColeccionCarta>()
                .HasOne(x => x.Coleccion)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.ColeccionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ColeccionCarta>()
                .HasOne(x => x.Carta)
                .WithMany(x => x.Colecciones)
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Cascade);


            // ========================================================
            // HABILIDAD
            // ========================================================

            modelBuilder.Entity<Habilidad>()
                .HasOne(x => x.CategoriaObjetivo)
                .WithMany(x => x.Habilidades)
                .HasForeignKey(x => x.CategoriaObjetivoId)
                .OnDelete(DeleteBehavior.SetNull);


            // ========================================================
            // CUPONES
            // ========================================================

            modelBuilder.Entity<Cupon>()
                .HasOne(x => x.Coleccion)
                .WithMany(x => x.Cupones)
                .HasForeignKey(x => x.ColeccionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UsuarioCupon>()
                .HasOne(x => x.Usuario)
                .WithMany(x => x.Cupones)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UsuarioCupon>()
                .HasOne(x => x.Cupon)
                .WithMany(x => x.Usuarios)
                .HasForeignKey(x => x.CuponId)
                .OnDelete(DeleteBehavior.Cascade);


            // ========================================================
            // SOBRES
            // ========================================================

            modelBuilder.Entity<Sobre>()
                .HasOne(x => x.Categoria)
                .WithMany()
                .HasForeignKey(x => x.CategoriaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Sobre>()
                .HasOne(x => x.Coleccion)
                .WithMany()
                .HasForeignKey(x => x.ColeccionId)
                .OnDelete(DeleteBehavior.SetNull);


            // ========================================================
            // APERTURA DE SOBRES
            // ========================================================

            modelBuilder.Entity<AperturaSobre>()
                .HasOne(x => x.Usuario)
                .WithMany()
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AperturaSobre>()
                .HasOne(x => x.Sobre)
                .WithMany(x => x.Aperturas)
                .HasForeignKey(x => x.SobreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AperturaSobreCarta>()
                .HasOne(x => x.AperturaSobre)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.AperturaSobreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AperturaSobreCarta>()
                .HasOne(x => x.Carta)
                .WithMany(x => x.Aperturas)
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // ZONAS
            // ========================================================

            modelBuilder.Entity<ZonaCategoria>()
                .HasOne(x => x.Zona)
                .WithMany(x => x.Categorias)
                .HasForeignKey(x => x.ZonaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ZonaCategoria>()
                .HasOne(x => x.Categoria)
                .WithMany(x => x.Zonas)
                .HasForeignKey(x => x.CategoriaId)
                .OnDelete(DeleteBehavior.Cascade);


            // ========================================================
            // MAZOS
            // ========================================================

            modelBuilder.Entity<Mazo>()
                .HasOne(x => x.Usuario)
                .WithMany(x => x.Mazos)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MazoCarta>()
                .HasOne(x => x.Mazo)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.MazoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MazoCarta>()
                .HasOne(x => x.Carta)
                .WithMany(x => x.Mazos)
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Cascade);


            // ========================================================
            // PARTIDAS
            // ========================================================

            modelBuilder.Entity<Partida>()
                .HasOne(x => x.Ganador)
                .WithMany()
                .HasForeignKey(x => x.GanadorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<JugadorPartida>()
                .HasOne(x => x.Partida)
                .WithMany(x => x.Jugadores)
                .HasForeignKey(x => x.PartidaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<JugadorPartida>()
                .HasOne(x => x.Usuario)
                .WithMany(x => x.Partidas)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<JugadorPartida>()
                .HasOne(x => x.Mazo)
                .WithMany(x => x.Partidas)
                .HasForeignKey(x => x.MazoId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // RONDAS
            // ========================================================

            modelBuilder.Entity<Ronda>()
                .HasOne(x => x.Partida)
                .WithMany(x => x.Rondas)
                .HasForeignKey(x => x.PartidaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ronda>()
                .HasIndex(x => new { x.PartidaId, x.Numero })
                .IsUnique();


            // ========================================================
            // ZONAS DE PARTIDA
            // ========================================================

            modelBuilder.Entity<ZonaPartida>()
                .HasOne(x => x.Partida)
                .WithMany(x => x.Zonas)
                .HasForeignKey(x => x.PartidaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ZonaPartida>()
                .HasOne(x => x.Zona)
                .WithMany(x => x.Partidas)
                .HasForeignKey(x => x.ZonaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ZonaPartida>()
                .HasIndex(x => new { x.PartidaId, x.ZonaId })
                .IsUnique();


            // ========================================================
            // ZONAS DE RONDA
            // ========================================================

            modelBuilder.Entity<ZonaRonda>()
                .HasOne(x => x.Ronda)
                .WithMany(x => x.Zonas)
                .HasForeignKey(x => x.RondaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ZonaRonda>()
                .HasOne(x => x.ZonaPartida)
                .WithMany(x => x.Rondas)
                .HasForeignKey(x => x.ZonaPartidaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ZonaRonda>()
                .HasIndex(x => new { x.RondaId, x.ZonaPartidaId })
                .IsUnique();


            // ========================================================
            // CARTAS DURANTE PARTIDA
            // ========================================================

            modelBuilder.Entity<CartaPartida>()
                .HasOne(x => x.JugadorPartida)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.JugadorPartidaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartaPartida>()
                .HasOne(x => x.Carta)
                .WithMany(x => x.CartasPartida)
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartaPartida>()
                .HasOne(x => x.Ronda)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.RondaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CartaPartida>()
                .HasOne(x => x.ZonaPartida)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.ZonaPartidaId)
                .OnDelete(DeleteBehavior.SetNull);


            // ========================================================
            // RESULTADO DE ZONA
            // ========================================================

            modelBuilder.Entity<ResultadoZona>()
                .HasOne(x => x.Ronda)
                .WithMany(x => x.Resultados)
                .HasForeignKey(x => x.RondaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResultadoZona>()
                .HasOne(x => x.ZonaPartida)
                .WithMany(x => x.Resultados)
                .HasForeignKey(x => x.ZonaPartidaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ResultadoZona>()
                .HasIndex(x => new { x.RondaId, x.ZonaPartidaId })
                .IsUnique();


            // ========================================================
            // MATCHMAKING
            // ========================================================

            modelBuilder.Entity<Matchmaking>()
                .HasOne(x => x.Usuario)
                .WithMany(x => x.Matchmakings)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Matchmaking>()
                .HasOne(x => x.Mazo)
                .WithMany(x => x.Matchmakings)
                .HasForeignKey(x => x.MazoId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // INTERCAMBIOS
            // ========================================================

            modelBuilder.Entity<Intercambio>()
                .HasOne(x => x.UsuarioOfertante)
                .WithMany()
                .HasForeignKey(x => x.UsuarioOfertanteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Intercambio>()
                .HasOne(x => x.UsuarioReceptor)
                .WithMany()
                .HasForeignKey(x => x.UsuarioReceptorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IntercambioCarta>()
                .HasOne(x => x.Intercambio)
                .WithMany(x => x.Cartas)
                .HasForeignKey(x => x.IntercambioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<IntercambioCarta>()
                .HasOne(x => x.Usuario)
                .WithMany()
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IntercambioCarta>()
                .HasOne(x => x.Carta)
                .WithMany()
                .HasForeignKey(x => x.CartaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IntercambioMoneda>()
                .HasOne(x => x.Intercambio)
                .WithMany(x => x.Monedas)
                .HasForeignKey(x => x.IntercambioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<IntercambioMoneda>()
                .HasOne(x => x.Usuario)
                .WithMany()
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
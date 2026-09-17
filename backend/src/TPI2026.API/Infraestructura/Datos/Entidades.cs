using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TPI2026.API.Infraestructura.Datos
{
    // ============================================================
    // 1. USUARIO
    // ============================================================

    [Table("usuario")]
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime FechaRegistro { get; set; }

        public int Oro { get; set; }

        public int MonedasIntercambio { get; set; }

        public ICollection<UsuarioCarta> Cartas { get; set; } = new List<UsuarioCarta>();
        public ICollection<UsuarioCupon> Cupones { get; set; } = new List<UsuarioCupon>();
        public ICollection<Mazo> Mazos { get; set; } = new List<Mazo>();
        public ICollection<JugadorPartida> Partidas { get; set; } = new List<JugadorPartida>();
        public ICollection<Matchmaking> Matchmakings { get; set; } = new List<Matchmaking>();
    }


    // ============================================================
    // 2. CATEGORIA
    // ============================================================

    [Table("categoria")]
    public class Categoria
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public ICollection<Carta> Cartas { get; set; } = new List<Carta>();
        public ICollection<ZonaCategoria> Zonas { get; set; } = new List<ZonaCategoria>();
        public ICollection<Habilidad> Habilidades { get; set; } = new List<Habilidad>();
    }


    // ============================================================
    // 3. CARTA
    // ============================================================

    [Table("carta")]
    public class Carta
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public int Poder { get; set; }

        public int CostoMana { get; set; }

        [Required]
        [MaxLength(20)]
        public string Rareza { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImagenUrl { get; set; }

        public int CategoriaId { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria Categoria { get; set; } = null!;

        public ICollection<UsuarioCarta> Usuarios { get; set; } = new List<UsuarioCarta>();
        public ICollection<ColeccionCarta> Colecciones { get; set; } = new List<ColeccionCarta>();
        public Habilidad? Habilidad { get; set; }
        public ICollection<AperturaSobreCarta> Aperturas { get; set; } = new List<AperturaSobreCarta>();
        public ICollection<MazoCarta> Mazos { get; set; } = new List<MazoCarta>();
        public ICollection<CartaPartida> CartasPartida { get; set; } = new List<CartaPartida>();
    }


    // ============================================================
    // 4. USUARIO_CARTA
    // ============================================================

    [Table("usuariocarta")]
    public class UsuarioCarta
    {
        public int UsuarioId { get; set; }

        public int CartaId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }


    // ============================================================
    // 5. COLECCION
    // ============================================================

    [Table("coleccion")]
    public class Coleccion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        [MaxLength(500)]
        public string? ImagenUrl { get; set; }

        public ICollection<ColeccionCarta> Cartas { get; set; } = new List<ColeccionCarta>();
        public ICollection<Cupon> Cupones { get; set; } = new List<Cupon>();
    }


    // ============================================================
    // 6. COLECCION_CARTA
    // ============================================================

    [Table("coleccioncarta")]
    public class ColeccionCarta
    {
        public int ColeccionId { get; set; }

        public int CartaId { get; set; }

        [ForeignKey(nameof(ColeccionId))]
        public Coleccion Coleccion { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }


    // ============================================================
    // 7. HABILIDAD
    // ============================================================

    [Table("habilidad")]
    public class Habilidad
    {
        [Key]
        public int Id { get; set; }

        public int CartaId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty;

        public int? Valor { get; set; }

        public int? CategoriaObjetivoId { get; set; }

        public string? Descripcion { get; set; }

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;

        [ForeignKey(nameof(CategoriaObjetivoId))]
        public Categoria? CategoriaObjetivo { get; set; }
    }


    // ============================================================
    // 8. CUPON
    // ============================================================

    [Table("cupon")]
    public class Cupon
    {
        [Key]
        public int Id { get; set; }

        public int ColeccionId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        [Required]
        [MaxLength(100)]
        public string Codigo { get; set; } = string.Empty;

        public decimal PorcentajeDescuento { get; set; }

        public DateTime FechaInicio { get; set; }

        public DateTime FechaVencimiento { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        [ForeignKey(nameof(ColeccionId))]
        public Coleccion Coleccion { get; set; } = null!;

        public ICollection<UsuarioCupon> Usuarios { get; set; } = new List<UsuarioCupon>();
    }


    // ============================================================
    // 9. USUARIO_CUPON
    // ============================================================

    [Table("usuariocupon")]
    public class UsuarioCupon
    {
        public int UsuarioId { get; set; }

        public int CuponId { get; set; }

        public DateTime FechaObtencion { get; set; }

        public DateTime? FechaUso { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(CuponId))]
        public Cupon Cupon { get; set; } = null!;
    }


    // ============================================================
    // 10. SOBRE
    // ============================================================

    [Table("sobre")]
    public class Sobre
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Tipo { get; set; } = string.Empty;

        public int? CategoriaId { get; set; }

        public int? ColeccionId { get; set; }

        public int Precio { get; set; }

        public int CantidadCartas { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria? Categoria { get; set; }

        [ForeignKey(nameof(ColeccionId))]
        public Coleccion? Coleccion { get; set; }

        public ICollection<AperturaSobre> Aperturas { get; set; } = new List<AperturaSobre>();
    }


    // ============================================================
    // 11. APERTURA_SOBRE
    // ============================================================

    [Table("aperturasobre")]
    public class AperturaSobre
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int SobreId { get; set; }

        public DateTime Fecha { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(SobreId))]
        public Sobre Sobre { get; set; } = null!;

        public ICollection<AperturaSobreCarta> Cartas { get; set; } = new List<AperturaSobreCarta>();
    }


    // ============================================================
    // 12. APERTURA_SOBRE_CARTA
    // ============================================================

    [Table("aperturasobrecarta")]
    public class AperturaSobreCarta
    {
        [Key]
        public int Id { get; set; }

        public int AperturaSobreId { get; set; }

        public int CartaId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(AperturaSobreId))]
        public AperturaSobre AperturaSobre { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }


    // ============================================================
    // 13. ZONA
    // ============================================================

    [Table("zona")]
    public class Zona
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public ICollection<ZonaCategoria> Categorias { get; set; } = new List<ZonaCategoria>();
        public ICollection<ZonaPartida> Partidas { get; set; } = new List<ZonaPartida>();
    }


    // ============================================================
    // 14. ZONA_CATEGORIA
    // ============================================================

    [Table("zonacategoria")]
    public class ZonaCategoria
    {
        public int ZonaId { get; set; }

        public int CategoriaId { get; set; }

        public int BonusPoder { get; set; }

        [ForeignKey(nameof(ZonaId))]
        public Zona Zona { get; set; } = null!;

        [ForeignKey(nameof(CategoriaId))]
        public Categoria Categoria { get; set; } = null!;
    }


    // ============================================================
    // 15. MAZO
    // ============================================================

    [Table("mazo")]
    public class Mazo
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        public ICollection<MazoCarta> Cartas { get; set; } = new List<MazoCarta>();
        public ICollection<JugadorPartida> Partidas { get; set; } = new List<JugadorPartida>();
        public ICollection<Matchmaking> Matchmakings { get; set; } = new List<Matchmaking>();
    }


    // ============================================================
    // 16. MAZO_CARTA
    // ============================================================

    [Table("mazocarta")]
    public class MazoCarta
    {
        public int MazoId { get; set; }

        public int CartaId { get; set; }

        [ForeignKey(nameof(MazoId))]
        public Mazo Mazo { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }


    // ============================================================
    // 17. PARTIDA
    // ============================================================

    [Table("partida")]
    public class Partida
    {
        [Key]
        public int Id { get; set; }

        public DateTime FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        public int? GanadorId { get; set; }

        [ForeignKey(nameof(GanadorId))]
        public Usuario? Ganador { get; set; }

        public ICollection<JugadorPartida> Jugadores { get; set; } = new List<JugadorPartida>();
        public ICollection<Ronda> Rondas { get; set; } = new List<Ronda>();
        public ICollection<ZonaPartida> Zonas { get; set; } = new List<ZonaPartida>();
    }


    // ============================================================
    // 18. JUGADOR_PARTIDA
    // ============================================================

    [Table("jugadorpartida")]
    public class JugadorPartida
    {
        [Key]
        public int Id { get; set; }

        public int PartidaId { get; set; }

        public int UsuarioId { get; set; }

        public int MazoId { get; set; }

        public int Vida { get; set; }

        public int ManaActual { get; set; }

        [ForeignKey(nameof(PartidaId))]
        public Partida Partida { get; set; } = null!;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(MazoId))]
        public Mazo Mazo { get; set; } = null!;

        public ICollection<CartaPartida> Cartas { get; set; } = new List<CartaPartida>();
    }


    // ============================================================
    // 19. RONDA
    // ============================================================

    [Table("ronda")]
    public class Ronda
    {
        [Key]
        public int Id { get; set; }

        public int PartidaId { get; set; }

        public int Numero { get; set; }

        public DateTime FechaInicio { get; set; }

        public DateTime FechaFin { get; set; }

        [ForeignKey(nameof(PartidaId))]
        public Partida Partida { get; set; } = null!;

        public ICollection<ZonaRonda> Zonas { get; set; } = new List<ZonaRonda>();
        public ICollection<CartaPartida> Cartas { get; set; } = new List<CartaPartida>();
        public ICollection<ResultadoZona> Resultados { get; set; } = new List<ResultadoZona>();
    }


    // ============================================================
    // 20. ZONA_PARTIDA
    // ============================================================

    [Table("zonapartida")]
    public class ZonaPartida
    {
        [Key]
        public int Id { get; set; }

        public int PartidaId { get; set; }

        public int ZonaId { get; set; }

        [Required]
        [MaxLength(20)]
        public string PosicionInicial { get; set; } = string.Empty;

        [ForeignKey(nameof(PartidaId))]
        public Partida Partida { get; set; } = null!;

        [ForeignKey(nameof(ZonaId))]
        public Zona Zona { get; set; } = null!;

        public ICollection<ZonaRonda> Rondas { get; set; } = new List<ZonaRonda>();
        public ICollection<CartaPartida> Cartas { get; set; } = new List<CartaPartida>();
        public ICollection<ResultadoZona> Resultados { get; set; } = new List<ResultadoZona>();
    }


    // ============================================================
    // 21. ZONA_RONDA
    // ============================================================

    [Table("zonaronda")]
    public class ZonaRonda
    {
        [Key]
        public int Id { get; set; }

        public int RondaId { get; set; }

        public int ZonaPartidaId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Lado { get; set; } = string.Empty;

        [ForeignKey(nameof(RondaId))]
        public Ronda Ronda { get; set; } = null!;

        [ForeignKey(nameof(ZonaPartidaId))]
        public ZonaPartida ZonaPartida { get; set; } = null!;
    }


    // ============================================================
    // 22. CARTA_PARTIDA
    // ============================================================

    [Table("cartapartida")]
    public class CartaPartida
    {
        [Key]
        public int Id { get; set; }

        public int JugadorPartidaId { get; set; }

        public int CartaId { get; set; }

        public int? PosicionMazo { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        public int? RondaId { get; set; }

        public int? ZonaPartidaId { get; set; }

        [ForeignKey(nameof(JugadorPartidaId))]
        public JugadorPartida JugadorPartida { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;

        [ForeignKey(nameof(RondaId))]
        public Ronda? Ronda { get; set; }

        [ForeignKey(nameof(ZonaPartidaId))]
        public ZonaPartida? ZonaPartida { get; set; }
    }


    // ============================================================
    // 23. RESULTADO_ZONA
    // ============================================================

    [Table("resultadozona")]
    public class ResultadoZona
    {
        [Key]
        public int Id { get; set; }

        public int RondaId { get; set; }

        public int ZonaPartidaId { get; set; }

        public int PoderJugador1 { get; set; }

        public int PoderJugador2 { get; set; }

        public int DanioJugador1 { get; set; }

        public int DanioJugador2 { get; set; }

        [ForeignKey(nameof(RondaId))]
        public Ronda Ronda { get; set; } = null!;

        [ForeignKey(nameof(ZonaPartidaId))]
        public ZonaPartida ZonaPartida { get; set; } = null!;
    }


    // ============================================================
    // 24. MATCHMAKING
    // ============================================================

    [Table("matchmaking")]
    public class Matchmaking
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int MazoId { get; set; }

        public DateTime FechaEntrada { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(MazoId))]
        public Mazo Mazo { get; set; } = null!;
    }


    // ============================================================
    // 25. INTERCAMBIO
    // ============================================================

    [Table("intercambio")]
    public class Intercambio
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioOfertanteId { get; set; }

        public int UsuarioReceptorId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaFinalizacion { get; set; }

        [ForeignKey(nameof(UsuarioOfertanteId))]
        public Usuario UsuarioOfertante { get; set; } = null!;

        [ForeignKey(nameof(UsuarioReceptorId))]
        public Usuario UsuarioReceptor { get; set; } = null!;

        public ICollection<IntercambioCarta> Cartas { get; set; } = new List<IntercambioCarta>();
        public ICollection<IntercambioMoneda> Monedas { get; set; } = new List<IntercambioMoneda>();
    }


    // ============================================================
    // 26. INTERCAMBIO_CARTA
    // ============================================================

    [Table("intercambiocarta")]
    public class IntercambioCarta
    {
        [Key]
        public int Id { get; set; }

        public int IntercambioId { get; set; }

        public int UsuarioId { get; set; }

        public int CartaId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(IntercambioId))]
        public Intercambio Intercambio { get; set; } = null!;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }


    // ============================================================
    // 27. INTERCAMBIO_MONEDA
    // ============================================================

    [Table("intercambiomoneda")]
    public class IntercambioMoneda
    {
        [Key]
        public int Id { get; set; }

        public int IntercambioId { get; set; }

        public int UsuarioId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(IntercambioId))]
        public Intercambio Intercambio { get; set; } = null!;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;
    }
}
namespace TPI2026.Dominio.Entidades;

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

namespace TPI2026.Dominio.Entidades;

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

namespace TPI2026.Dominio.Entidades;

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

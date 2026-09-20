namespace TPI2026.Dominio.Entidades;

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

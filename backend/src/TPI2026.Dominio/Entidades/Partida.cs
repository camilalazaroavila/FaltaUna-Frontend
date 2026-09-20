namespace TPI2026.Dominio.Entidades;

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

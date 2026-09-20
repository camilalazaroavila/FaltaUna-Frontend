namespace TPI2026.Dominio.Entidades;

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

namespace TPI2026.Dominio.Entidades;

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

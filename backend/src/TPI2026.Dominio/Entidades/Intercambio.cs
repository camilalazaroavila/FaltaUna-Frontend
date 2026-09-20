namespace TPI2026.Dominio.Entidades;

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

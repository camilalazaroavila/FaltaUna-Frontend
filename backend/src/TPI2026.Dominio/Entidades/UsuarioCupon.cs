namespace TPI2026.Dominio.Entidades;

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

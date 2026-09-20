namespace TPI2026.Dominio.Entidades;

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

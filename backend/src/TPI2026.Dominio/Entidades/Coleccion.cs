namespace TPI2026.Dominio.Entidades;

    [Table("coleccion")]
    public class Coleccion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        [MaxLength(500)]
        public string? ImagenUrl { get; set; }

        public ICollection<ColeccionCarta> Cartas { get; set; } = new List<ColeccionCarta>();
        public ICollection<Cupon> Cupones { get; set; } = new List<Cupon>();
    }

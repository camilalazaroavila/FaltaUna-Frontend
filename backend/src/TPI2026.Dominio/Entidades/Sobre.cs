namespace TPI2026.Dominio.Entidades;

    [Table("sobre")]
    public class Sobre
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Tipo { get; set; } = string.Empty;

        public int? CategoriaId { get; set; }

        public int? ColeccionId { get; set; }

        public int Precio { get; set; }

        public int CantidadCartas { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria? Categoria { get; set; }

        [ForeignKey(nameof(ColeccionId))]
        public Coleccion? Coleccion { get; set; }

        public ICollection<AperturaSobre> Aperturas { get; set; } = new List<AperturaSobre>();
    }

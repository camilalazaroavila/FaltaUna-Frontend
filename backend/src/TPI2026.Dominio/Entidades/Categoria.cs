namespace TPI2026.Dominio.Entidades;

    [Table("categoria")]
    public class Categoria
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public ICollection<Carta> Cartas { get; set; } = new List<Carta>();
        public ICollection<ZonaCategoria> Zonas { get; set; } = new List<ZonaCategoria>();
        public ICollection<Habilidad> Habilidades { get; set; } = new List<Habilidad>();
    }

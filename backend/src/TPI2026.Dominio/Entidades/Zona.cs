namespace TPI2026.Dominio.Entidades;

    [Table("zona")]
    public class Zona
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public ICollection<ZonaCategoria> Categorias { get; set; } = new List<ZonaCategoria>();
        public ICollection<ZonaPartida> Partidas { get; set; } = new List<ZonaPartida>();
    }

namespace TPI2026.Dominio.Entidades;

    [Table("carta")]
    public class Carta
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public int Poder { get; set; }

        public int CostoMana { get; set; }

        [Required]
        [MaxLength(20)]
        public string Rareza { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImagenUrl { get; set; }

        public int CategoriaId { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria Categoria { get; set; } = null!;

        public ICollection<UsuarioCarta> Usuarios { get; set; } = new List<UsuarioCarta>();
        public ICollection<ColeccionCarta> Colecciones { get; set; } = new List<ColeccionCarta>();
        public Habilidad? Habilidad { get; set; }
        public ICollection<AperturaSobreCarta> Aperturas { get; set; } = new List<AperturaSobreCarta>();
        public ICollection<MazoCarta> Mazos { get; set; } = new List<MazoCarta>();
        public ICollection<CartaPartida> CartasPartida { get; set; } = new List<CartaPartida>();
    }

namespace TPI2026.Dominio.Entidades;

    [Table("habilidad")]
    public class Habilidad
    {
        [Key]
        public int Id { get; set; }

        public int CartaId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty;

        public int? Valor { get; set; }

        public int? CategoriaObjetivoId { get; set; }

        public string? Descripcion { get; set; }

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;

        [ForeignKey(nameof(CategoriaObjetivoId))]
        public Categoria? CategoriaObjetivo { get; set; }
    }

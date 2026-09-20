namespace TPI2026.Dominio.Entidades;

    [Table("zonacategoria")]
    public class ZonaCategoria
    {
        public int ZonaId { get; set; }

        public int CategoriaId { get; set; }

        public int BonusPoder { get; set; }

        [ForeignKey(nameof(ZonaId))]
        public Zona Zona { get; set; } = null!;

        [ForeignKey(nameof(CategoriaId))]
        public Categoria Categoria { get; set; } = null!;
    }

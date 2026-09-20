namespace TPI2026.Dominio.Entidades;

    [Table("mazocarta")]
    public class MazoCarta
    {
        public int MazoId { get; set; }

        public int CartaId { get; set; }

        [ForeignKey(nameof(MazoId))]
        public Mazo Mazo { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }

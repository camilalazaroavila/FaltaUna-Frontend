namespace TPI2026.Dominio.Entidades;

    [Table("coleccioncarta")]
    public class ColeccionCarta
    {
        public int ColeccionId { get; set; }

        public int CartaId { get; set; }

        [ForeignKey(nameof(ColeccionId))]
        public Coleccion Coleccion { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }

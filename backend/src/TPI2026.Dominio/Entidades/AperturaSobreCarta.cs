namespace TPI2026.Dominio.Entidades;

    [Table("aperturasobrecarta")]
    public class AperturaSobreCarta
    {
        [Key]
        public int Id { get; set; }

        public int AperturaSobreId { get; set; }

        public int CartaId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(AperturaSobreId))]
        public AperturaSobre AperturaSobre { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }

namespace TPI2026.Dominio.Entidades;

    [Table("aperturasobre")]
    public class AperturaSobre
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int SobreId { get; set; }

        public DateTime Fecha { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(SobreId))]
        public Sobre Sobre { get; set; } = null!;

        public ICollection<AperturaSobreCarta> Cartas { get; set; } = new List<AperturaSobreCarta>();
    }

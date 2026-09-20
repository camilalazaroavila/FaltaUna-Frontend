namespace TPI2026.Dominio.Entidades;

    [Table("usuariocarta")]
    public class UsuarioCarta
    {
        public int UsuarioId { get; set; }

        public int CartaId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(CartaId))]
        public Carta Carta { get; set; } = null!;
    }

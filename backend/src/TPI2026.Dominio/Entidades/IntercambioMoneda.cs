namespace TPI2026.Dominio.Entidades;

    [Table("intercambiomoneda")]
    public class IntercambioMoneda
    {
        [Key]
        public int Id { get; set; }

        public int IntercambioId { get; set; }

        public int UsuarioId { get; set; }

        public int Cantidad { get; set; }

        [ForeignKey(nameof(IntercambioId))]
        public Intercambio Intercambio { get; set; } = null!;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;
    }

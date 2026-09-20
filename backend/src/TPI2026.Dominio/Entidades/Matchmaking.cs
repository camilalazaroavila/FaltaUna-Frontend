namespace TPI2026.Dominio.Entidades;

    [Table("matchmaking")]
    public class Matchmaking
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int MazoId { get; set; }

        public DateTime FechaEntrada { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        [ForeignKey(nameof(MazoId))]
        public Mazo Mazo { get; set; } = null!;
    }

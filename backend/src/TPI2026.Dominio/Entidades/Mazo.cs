namespace TPI2026.Dominio.Entidades;

    [Table("mazo")]
    public class Mazo
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [ForeignKey(nameof(UsuarioId))]
        public Usuario Usuario { get; set; } = null!;

        public ICollection<MazoCarta> Cartas { get; set; } = new List<MazoCarta>();
        public ICollection<JugadorPartida> Partidas { get; set; } = new List<JugadorPartida>();
        public ICollection<Matchmaking> Matchmakings { get; set; } = new List<Matchmaking>();
    }

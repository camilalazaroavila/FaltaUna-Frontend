namespace TPI2026.Dominio.Entidades;

    [Table("Usuario")]
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime FechaRegistro { get; set; }

        public int Oro { get; set; }

        public int MonedasIntercambio { get; set; }

        public ICollection<UsuarioCarta> Cartas { get; set; } = new List<UsuarioCarta>();
        public ICollection<UsuarioCupon> Cupones { get; set; } = new List<UsuarioCupon>();
        public ICollection<Mazo> Mazos { get; set; } = new List<Mazo>();
        public ICollection<JugadorPartida> Partidas { get; set; } = new List<JugadorPartida>();
        public ICollection<Matchmaking> Matchmakings { get; set; } = new List<Matchmaking>();
    }

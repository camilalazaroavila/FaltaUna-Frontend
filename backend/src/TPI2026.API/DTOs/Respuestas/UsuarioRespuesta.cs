namespace TPI2026.API.DTOs.Respuestas;

public record UsuarioRespuesta(
    int Id,
    string NombreUsuario,
    string Email,
    DateTime FechaRegistro,
    int Oro,
    int MonedasIntercambio
);

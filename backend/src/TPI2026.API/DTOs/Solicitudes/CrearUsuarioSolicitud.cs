using System.ComponentModel.DataAnnotations;

namespace TPI2026.API.DTOs.Solicitudes;

public record CrearUsuarioSolicitud(
    [Required][MaxLength(50)] string NombreUsuario,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MinLength(6)] string Password
);

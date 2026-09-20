using System.Net;
using System.Text.Json;
using TPI2026.Dominio.Excepciones;

namespace TPI2026.API.Middlewares;

public class ManejadorErroresMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ManejadorErroresMiddleware> _logger;

    public ManejadorErroresMiddleware(RequestDelegate next, ILogger<ManejadorErroresMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DominioException ex)
        {
            _logger.LogWarning(ex, "Error de dominio: {Mensaje}", ex.Message);
            await ManejarExcepcionAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado");
            await ManejarExcepcionAsync(context, HttpStatusCode.InternalServerError, "Ocurrió un error inesperado.");
        }
    }

    private static async Task ManejarExcepcionAsync(HttpContext context, HttpStatusCode statusCode, string mensaje)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var respuesta = new
        {
            status = (int)statusCode,
            mensaje = mensaje,
            fecha = DateTime.UtcNow
        };

        var opciones = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(respuesta, opciones));
    }
}

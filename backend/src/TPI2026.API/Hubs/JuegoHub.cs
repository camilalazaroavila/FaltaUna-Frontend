/*
using Microsoft.AspNetCore.SignalR;
using TPI2026.API.Servicios;

namespace TPI2026.API.Hubs;

// El Hub de SignalR maneja la comunicación en tiempo real entre el servidor y los jugadores
public class JuegoHub : Hub
{
    private readonly SalasServicio _salasServicio;

    // Inyección de dependencias para usar el servicio que gestiona el estado de las salas
    public JuegoHub(SalasServicio salasServicio)
    {
        _salasServicio = salasServicio;
    }

    // Se ejecuta automáticamente cuando un usuario abre la conexión WebSocket
    public override async Task OnConnectedAsync()
    {
        // Le confirma al usuario recién conectado su ID de conexión único
        await Clients.Caller.SendAsync("Conectado", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    // Se ejecuta cuando el usuario se desconecta (cerró la página, perdió internet, etc.)
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Busca si el usuario estaba participando en alguna sala activa
        var salaId = _salasServicio.ObtenerSalaDeConexion(Context.ConnectionId);
        if (!string.IsNullOrEmpty(salaId))
        {
            // Lo saca del grupo de SignalR y remueve su registro en la lógica del servicio
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, salaId);
            _salasServicio.SalirDeSala(salaId, Context.ConnectionId);
            
            // Avisa a todos los demás jugadores de la sala que este usuario salió
            await Clients.Group(salaId).SendAsync("JugadorSalio", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Método que llama el frontend para sumar un usuario a una partida o lobby específico
    public async Task UnirseASala(string salaId, string nombreUsuario)
    {
        // Une la conexión al canal de SignalR de esa sala
        await Groups.AddToGroupAsync(Context.ConnectionId, salaId);
        _salasServicio.UnirseASala(salaId, Context.ConnectionId, nombreUsuario);

        // Notifica a todos los miembros de la sala sobre el nuevo participante
        await Clients.Group(salaId).SendAsync("JugadorUnido", new
        {
            SalaId = salaId,
            ConexionId = Context.ConnectionId,
            NombreUsuario = nombreUsuario
        });
    }

    // Transmite jugadas o movimientos en vivo a los rivales
    public async Task EnviarAccionJuego(string salaId, object accion)
    {
        // Envía la acción enviada por el jugador a todos los demás en la sala (menos al emisor)
        await Clients.OthersInGroup(salaId).SendAsync("AccionRecibida", accion);
    }
}
*/
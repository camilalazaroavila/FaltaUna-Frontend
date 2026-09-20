/*
using System.Collections.Concurrent;

namespace TPI2026.API.Servicios;

// Servicio Singleton que gestiona el estado de las salas y conexiones en memoria RAM
public class SalasServicio
{
    // Diccionario concurrente: mapea el ID de la sala hacia otro diccionario de (ConexionID -> NombreUsuario)
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _salas = new();

    // Diccionario concurrente: mapea el ID de conexion de SignalR hacia el ID de la sala donde esta metido
    private readonly ConcurrentDictionary<string, string> _conexiones = new();

    // Agrega o actualiza la participacion de un jugador en una sala determinada
    public void UnirseASala(string salaId, string conexionId, string nombreUsuario)
    {
        _conexiones[conexionId] = salaId;
        
        // Obtiene la sala existente o crea una nueva entrada concurrente si no existia
        var jugadores = _salas.GetOrAdd(salaId, _ => new ConcurrentDictionary<string, string>());
        jugadores[conexionId] = nombreUsuario;
    }

    // Remueve a un jugador de una sala y destruye la sala si se queda vacia
    public void SalirDeSala(string salaId, string conexionId)
    {
        // Elimina el rastreo de la conexion en el indice secundario
        _conexiones.TryRemove(conexionId, out _);

        // Busca la sala y remueve la conexion del diccionario de jugadores
        if (_salas.TryGetValue(salaId, out var jugadores))
        {
            jugadores.TryRemove(conexionId, out _);

            // Si la sala se quedo sin participantes, se elimina de la memoria RAM para liberar recursos
            if (jugadores.IsEmpty)
            {
                _salas.TryRemove(salaId, out _);
            }
        }
    }

    // Retorna el ID de la sala asociada a un ID de conexion de SignalR especifico
    public string? ObtenerSalaDeConexion(string conexionId)
    {
        _conexiones.TryGetValue(conexionId, out var salaId);
        return salaId;
    }

    // Devuelve la lista con los nombres de usuario presentes en una sala
    public IReadOnlyCollection<string> ObtenerJugadores(string salaId)
    {
        if (_salas.TryGetValue(salaId, out var jugadores))
        {
            return jugadores.Values.ToList();
        }
        return Array.Empty<string>();
    }
}
*/
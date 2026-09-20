namespace TPI2026.Dominio.Excepciones;

public class DominioException : Exception
{
    public DominioException()
    {
    }

    public DominioException(string mensaje) : base(mensaje)
    {
    }

    public DominioException(string mensaje, Exception innerException) : base(mensaje, innerException)
    {
    }
}

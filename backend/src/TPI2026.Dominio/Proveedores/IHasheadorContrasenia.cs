namespace TPI2026.Dominio.Proveedores;

public interface IHasheadorContrasenia
{
    string Hashear(string contrasenia);
    bool Verificar(string contrasenia, string hash);
}

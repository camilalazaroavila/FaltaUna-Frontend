using System.Security.Cryptography;
using TPI2026.Dominio.Proveedores;

namespace TPI2026.Infraestructura.Proveedores;

public class HasheadorContrasenia : IHasheadorContrasenia
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public string Hashear(string contrasenia)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(contrasenia, salt, Iterations, Algorithm, KeySize);

        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Verificar(string contrasenia, string hashArmado)
    {
        var partes = hashArmado.Split('.');
        if (partes.Length != 2)
            return false;

        try
        {
            byte[] salt = Convert.FromBase64String(partes[0]);
            byte[] hashEsperado = Convert.FromBase64String(partes[1]);

            byte[] hashCalculado = Rfc2898DeriveBytes.Pbkdf2(contrasenia, salt, Iterations, Algorithm, KeySize);

            return CryptographicOperations.FixedTimeEquals(hashEsperado, hashCalculado);
        }
        catch
        {
            return false;
        }
    }
}

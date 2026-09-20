using Microsoft.EntityFrameworkCore;
// using TPI2026.API.Hubs; // Comentado temp (SignalR)
using TPI2026.API.Middlewares;
//using TPI2026.API.Servicios;
using TPI2026.Dominio.CasosDeUso.Usuarios;
using TPI2026.Dominio.Proveedores;
using TPI2026.Dominio.Repositorios;
using TPI2026.Infraestructura.Data;
using TPI2026.Infraestructura.Proveedores;
using TPI2026.Infraestructura.Repositorios;

var builder = WebApplication.CreateBuilder(args);

// Entity Framework & MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 4, 0))
    )
);

// Inyección de dependencias - Dominio & Infraestructura
builder.Services.AddScoped<IUsuarioRepositorio, UsuarioRepositorio>();
builder.Services.AddScoped<IHasheadorContrasenia, HasheadorContrasenia>();
builder.Services.AddScoped<ObtenerUsuariosUseCase>();
builder.Services.AddScoped<CrearUsuarioUseCase>();

// Inyección de dependencias - API Servicios
// builder.Services.AddSingleton<SalasServicio>(); // Comentado temporalmente (Lógica de Salas)

// SignalR
// builder.Services.AddSignalR(); // Comentado tempor (SignalR)

// Controladores
builder.Services.AddControllers();

// CORS - Permitir Angular con credenciales para SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:4300")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// OpenAPI & Swagger
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware global de errores
app.UseMiddleware<ManejadorErroresMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS
app.UseCors("AngularPolicy");

app.UseAuthorization();

app.MapControllers();

// SignalR Hubs
// app.MapHub<JuegoHub>("/hubs/juego"); // Comentado tempo (Endpoint de SignalR)

app.Run();
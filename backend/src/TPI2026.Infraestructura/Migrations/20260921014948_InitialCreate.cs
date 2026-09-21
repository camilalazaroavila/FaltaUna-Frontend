using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TPI2026.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "categoria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categoria", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "coleccion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImagenUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coleccion", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NombreUsuario = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Oro = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    MonedasIntercambio = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "zona",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zona", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "carta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Poder = table.Column<int>(type: "int", nullable: false),
                    CostoMana = table.Column<int>(type: "int", nullable: false),
                    Rareza = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImagenUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CategoriaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_carta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_carta_categoria_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categoria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "cupon",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ColeccionId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Codigo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PorcentajeDescuento = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cupon", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cupon_coleccion_ColeccionId",
                        column: x => x.ColeccionId,
                        principalTable: "coleccion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "sobre",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tipo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CategoriaId = table.Column<int>(type: "int", nullable: true),
                    ColeccionId = table.Column<int>(type: "int", nullable: true),
                    Precio = table.Column<int>(type: "int", nullable: false),
                    CantidadCartas = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sobre", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sobre_categoria_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categoria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_sobre_coleccion_ColeccionId",
                        column: x => x.ColeccionId,
                        principalTable: "coleccion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "intercambio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UsuarioOfertanteId = table.Column<int>(type: "int", nullable: false),
                    UsuarioReceptorId = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FechaCreacion = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FechaFinalizacion = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intercambio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_intercambio_Usuario_UsuarioOfertanteId",
                        column: x => x.UsuarioOfertanteId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_intercambio_Usuario_UsuarioReceptorId",
                        column: x => x.UsuarioReceptorId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "mazo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mazo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_mazo_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "partida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FechaInicio = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GanadorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_partida_Usuario_GanadorId",
                        column: x => x.GanadorId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "zonacategoria",
                columns: table => new
                {
                    ZonaId = table.Column<int>(type: "int", nullable: false),
                    CategoriaId = table.Column<int>(type: "int", nullable: false),
                    BonusPoder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zonacategoria", x => new { x.ZonaId, x.CategoriaId });
                    table.ForeignKey(
                        name: "FK_zonacategoria_categoria_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categoria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_zonacategoria_zona_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "zona",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "coleccioncarta",
                columns: table => new
                {
                    ColeccionId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coleccioncarta", x => new { x.ColeccionId, x.CartaId });
                    table.ForeignKey(
                        name: "FK_coleccioncarta_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_coleccioncarta_coleccion_ColeccionId",
                        column: x => x.ColeccionId,
                        principalTable: "coleccion",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "habilidad",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CartaId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Valor = table.Column<int>(type: "int", nullable: true),
                    CategoriaObjetivoId = table.Column<int>(type: "int", nullable: true),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_habilidad", x => x.Id);
                    table.ForeignKey(
                        name: "FK_habilidad_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_habilidad_categoria_CategoriaObjetivoId",
                        column: x => x.CategoriaObjetivoId,
                        principalTable: "categoria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "usuariocarta",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuariocarta", x => new { x.UsuarioId, x.CartaId });
                    table.ForeignKey(
                        name: "FK_usuariocarta_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_usuariocarta_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "usuariocupon",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    CuponId = table.Column<int>(type: "int", nullable: false),
                    FechaObtencion = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FechaUso = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuariocupon", x => new { x.UsuarioId, x.CuponId });
                    table.ForeignKey(
                        name: "FK_usuariocupon_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_usuariocupon_cupon_CuponId",
                        column: x => x.CuponId,
                        principalTable: "cupon",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "aperturasobre",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    SobreId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aperturasobre", x => x.Id);
                    table.ForeignKey(
                        name: "FK_aperturasobre_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_aperturasobre_sobre_SobreId",
                        column: x => x.SobreId,
                        principalTable: "sobre",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "intercambiocarta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IntercambioId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intercambiocarta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_intercambiocarta_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_intercambiocarta_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_intercambiocarta_intercambio_IntercambioId",
                        column: x => x.IntercambioId,
                        principalTable: "intercambio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "intercambiomoneda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IntercambioId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intercambiomoneda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_intercambiomoneda_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_intercambiomoneda_intercambio_IntercambioId",
                        column: x => x.IntercambioId,
                        principalTable: "intercambio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "matchmaking",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MazoId = table.Column<int>(type: "int", nullable: false),
                    FechaEntrada = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_matchmaking", x => x.Id);
                    table.ForeignKey(
                        name: "FK_matchmaking_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_matchmaking_mazo_MazoId",
                        column: x => x.MazoId,
                        principalTable: "mazo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "mazocarta",
                columns: table => new
                {
                    MazoId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mazocarta", x => new { x.MazoId, x.CartaId });
                    table.ForeignKey(
                        name: "FK_mazocarta_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_mazocarta_mazo_MazoId",
                        column: x => x.MazoId,
                        principalTable: "mazo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "jugadorpartida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PartidaId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MazoId = table.Column<int>(type: "int", nullable: false),
                    Vida = table.Column<int>(type: "int", nullable: false),
                    ManaActual = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_jugadorpartida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_jugadorpartida_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_jugadorpartida_mazo_MazoId",
                        column: x => x.MazoId,
                        principalTable: "mazo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_jugadorpartida_partida_PartidaId",
                        column: x => x.PartidaId,
                        principalTable: "partida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ronda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PartidaId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ronda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ronda_partida_PartidaId",
                        column: x => x.PartidaId,
                        principalTable: "partida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "zonapartida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PartidaId = table.Column<int>(type: "int", nullable: false),
                    ZonaId = table.Column<int>(type: "int", nullable: false),
                    PosicionInicial = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zonapartida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_zonapartida_partida_PartidaId",
                        column: x => x.PartidaId,
                        principalTable: "partida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_zonapartida_zona_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "zona",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "aperturasobrecarta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AperturaSobreId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aperturasobrecarta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_aperturasobrecarta_aperturasobre_AperturaSobreId",
                        column: x => x.AperturaSobreId,
                        principalTable: "aperturasobre",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_aperturasobrecarta_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "cartapartida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    JugadorPartidaId = table.Column<int>(type: "int", nullable: false),
                    CartaId = table.Column<int>(type: "int", nullable: false),
                    PosicionMazo = table.Column<int>(type: "int", nullable: true),
                    Estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RondaId = table.Column<int>(type: "int", nullable: true),
                    ZonaPartidaId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cartapartida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cartapartida_carta_CartaId",
                        column: x => x.CartaId,
                        principalTable: "carta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cartapartida_jugadorpartida_JugadorPartidaId",
                        column: x => x.JugadorPartidaId,
                        principalTable: "jugadorpartida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cartapartida_ronda_RondaId",
                        column: x => x.RondaId,
                        principalTable: "ronda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_cartapartida_zonapartida_ZonaPartidaId",
                        column: x => x.ZonaPartidaId,
                        principalTable: "zonapartida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "resultadozona",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RondaId = table.Column<int>(type: "int", nullable: false),
                    ZonaPartidaId = table.Column<int>(type: "int", nullable: false),
                    PoderJugador1 = table.Column<int>(type: "int", nullable: false),
                    PoderJugador2 = table.Column<int>(type: "int", nullable: false),
                    DanioJugador1 = table.Column<int>(type: "int", nullable: false),
                    DanioJugador2 = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resultadozona", x => x.Id);
                    table.ForeignKey(
                        name: "FK_resultadozona_ronda_RondaId",
                        column: x => x.RondaId,
                        principalTable: "ronda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_resultadozona_zonapartida_ZonaPartidaId",
                        column: x => x.ZonaPartidaId,
                        principalTable: "zonapartida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "zonaronda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RondaId = table.Column<int>(type: "int", nullable: false),
                    ZonaPartidaId = table.Column<int>(type: "int", nullable: false),
                    Lado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zonaronda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_zonaronda_ronda_RondaId",
                        column: x => x.RondaId,
                        principalTable: "ronda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_zonaronda_zonapartida_ZonaPartidaId",
                        column: x => x.ZonaPartidaId,
                        principalTable: "zonapartida",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_aperturasobre_SobreId",
                table: "aperturasobre",
                column: "SobreId");

            migrationBuilder.CreateIndex(
                name: "IX_aperturasobre_UsuarioId",
                table: "aperturasobre",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_aperturasobrecarta_AperturaSobreId",
                table: "aperturasobrecarta",
                column: "AperturaSobreId");

            migrationBuilder.CreateIndex(
                name: "IX_aperturasobrecarta_CartaId",
                table: "aperturasobrecarta",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_carta_CategoriaId",
                table: "carta",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_cartapartida_CartaId",
                table: "cartapartida",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_cartapartida_JugadorPartidaId",
                table: "cartapartida",
                column: "JugadorPartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_cartapartida_RondaId",
                table: "cartapartida",
                column: "RondaId");

            migrationBuilder.CreateIndex(
                name: "IX_cartapartida_ZonaPartidaId",
                table: "cartapartida",
                column: "ZonaPartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_coleccioncarta_CartaId",
                table: "coleccioncarta",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_cupon_Codigo",
                table: "cupon",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cupon_ColeccionId",
                table: "cupon",
                column: "ColeccionId");

            migrationBuilder.CreateIndex(
                name: "IX_habilidad_CartaId",
                table: "habilidad",
                column: "CartaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_habilidad_CategoriaObjetivoId",
                table: "habilidad",
                column: "CategoriaObjetivoId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambio_UsuarioOfertanteId",
                table: "intercambio",
                column: "UsuarioOfertanteId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambio_UsuarioReceptorId",
                table: "intercambio",
                column: "UsuarioReceptorId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambiocarta_CartaId",
                table: "intercambiocarta",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambiocarta_IntercambioId",
                table: "intercambiocarta",
                column: "IntercambioId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambiocarta_UsuarioId",
                table: "intercambiocarta",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambiomoneda_IntercambioId",
                table: "intercambiomoneda",
                column: "IntercambioId");

            migrationBuilder.CreateIndex(
                name: "IX_intercambiomoneda_UsuarioId",
                table: "intercambiomoneda",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_jugadorpartida_MazoId",
                table: "jugadorpartida",
                column: "MazoId");

            migrationBuilder.CreateIndex(
                name: "IX_jugadorpartida_PartidaId",
                table: "jugadorpartida",
                column: "PartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_jugadorpartida_UsuarioId",
                table: "jugadorpartida",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_matchmaking_MazoId",
                table: "matchmaking",
                column: "MazoId");

            migrationBuilder.CreateIndex(
                name: "IX_matchmaking_UsuarioId",
                table: "matchmaking",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_mazo_UsuarioId",
                table: "mazo",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_mazocarta_CartaId",
                table: "mazocarta",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_partida_GanadorId",
                table: "partida",
                column: "GanadorId");

            migrationBuilder.CreateIndex(
                name: "IX_resultadozona_RondaId_ZonaPartidaId",
                table: "resultadozona",
                columns: new[] { "RondaId", "ZonaPartidaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_resultadozona_ZonaPartidaId",
                table: "resultadozona",
                column: "ZonaPartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_ronda_PartidaId_Numero",
                table: "ronda",
                columns: new[] { "PartidaId", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sobre_CategoriaId",
                table: "sobre",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_sobre_ColeccionId",
                table: "sobre",
                column: "ColeccionId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_Email",
                table: "Usuario",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_NombreUsuario",
                table: "Usuario",
                column: "NombreUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuariocarta_CartaId",
                table: "usuariocarta",
                column: "CartaId");

            migrationBuilder.CreateIndex(
                name: "IX_usuariocupon_CuponId",
                table: "usuariocupon",
                column: "CuponId");

            migrationBuilder.CreateIndex(
                name: "IX_zonacategoria_CategoriaId",
                table: "zonacategoria",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_zonapartida_PartidaId_ZonaId",
                table: "zonapartida",
                columns: new[] { "PartidaId", "ZonaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_zonapartida_ZonaId",
                table: "zonapartida",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_zonaronda_RondaId_ZonaPartidaId",
                table: "zonaronda",
                columns: new[] { "RondaId", "ZonaPartidaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_zonaronda_ZonaPartidaId",
                table: "zonaronda",
                column: "ZonaPartidaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aperturasobrecarta");

            migrationBuilder.DropTable(
                name: "cartapartida");

            migrationBuilder.DropTable(
                name: "coleccioncarta");

            migrationBuilder.DropTable(
                name: "habilidad");

            migrationBuilder.DropTable(
                name: "intercambiocarta");

            migrationBuilder.DropTable(
                name: "intercambiomoneda");

            migrationBuilder.DropTable(
                name: "matchmaking");

            migrationBuilder.DropTable(
                name: "mazocarta");

            migrationBuilder.DropTable(
                name: "resultadozona");

            migrationBuilder.DropTable(
                name: "usuariocarta");

            migrationBuilder.DropTable(
                name: "usuariocupon");

            migrationBuilder.DropTable(
                name: "zonacategoria");

            migrationBuilder.DropTable(
                name: "zonaronda");

            migrationBuilder.DropTable(
                name: "aperturasobre");

            migrationBuilder.DropTable(
                name: "jugadorpartida");

            migrationBuilder.DropTable(
                name: "intercambio");

            migrationBuilder.DropTable(
                name: "carta");

            migrationBuilder.DropTable(
                name: "cupon");

            migrationBuilder.DropTable(
                name: "ronda");

            migrationBuilder.DropTable(
                name: "zonapartida");

            migrationBuilder.DropTable(
                name: "sobre");

            migrationBuilder.DropTable(
                name: "mazo");

            migrationBuilder.DropTable(
                name: "partida");

            migrationBuilder.DropTable(
                name: "zona");

            migrationBuilder.DropTable(
                name: "categoria");

            migrationBuilder.DropTable(
                name: "coleccion");

            migrationBuilder.DropTable(
                name: "Usuario");
        }
    }
}

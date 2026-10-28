import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { ExpoService } from '@servicios/expo.service';
import type {
  ConfiguracionExpo,
  SobreResumen,
  UsuarioResumen,
} from '@modelos/expo.model';

/** Resultados de búsqueda que se muestran a la vez. */
const MAX_RESULTADOS = 8;
/** Caracteres mínimos para buscar un usuario. */
const MIN_BUSQUEDA = 2;
/** Entregas que se recuerdan en pantalla para control del admin. */
const MAX_ENTREGAS = 5;

interface EntregaRegistrada {
  usuario: string;
  sobre: string;
  hora: string;
}

@Component({
  selector: 'app-expo-admin',
  standalone: true,
  templateUrl: './expo-admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpoAdmin {
  private readonly expoService = inject(ExpoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(false);
  protected readonly entregando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly sobres = signal<SobreResumen[]>([]);
  protected readonly configuracion = signal<ConfiguracionExpo | null>(null);
  protected readonly usuarios = signal<UsuarioResumen[]>([]);

  /** Sobre que el admin tocó en la grilla (todavía no se guardó nada). */
  protected readonly seleccion = signal<number | null>(null);
  protected readonly busqueda = signal('');
  protected readonly usuarioElegido = signal<UsuarioResumen | null>(null);
  protected readonly entregas = signal<EntregaRegistrada[]>([]);

  /** Sobre sobre el que se va a actuar: el elegido o, si no tocó nada, el pendiente. */
  protected readonly sobreElegido = computed(
    () => this.seleccion() ?? this.configuracion()?.sobreRegaloId ?? null,
  );

  protected readonly sobreActual = computed(() => {
    const id = this.configuracion()?.sobreRegaloId;
    return id == null ? null : (this.sobres().find((s) => s.id === id) ?? { id });
  });

  protected readonly etiquetaElegida = computed(() => {
    const id = this.sobreElegido();
    return id == null ? null : this.nombreSobre(id);
  });

  protected readonly busquedaCorta = computed(
    () => this.busqueda().trim().length < MIN_BUSQUEDA,
  );

  protected readonly resultados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (texto.length < MIN_BUSQUEDA) return [];

    return this.usuarios()
      .filter(
        (u) =>
          u.nombreUsuario.toLowerCase().includes(texto) ||
          u.email.toLowerCase().includes(texto),
      )
      .slice(0, MAX_RESULTADOS);
  });

  constructor() {
    this.cargarPanel();
    this.iniciarPolling();
  }

  protected etiqueta(sobre: SobreResumen): string {
    return sobre.nombre ?? `Sobre #${sobre.id}`;
  }

  /** Tocar un premio solo lo selecciona: no se envía nada hasta confirmar la entrega. */
  protected elegirSobre(sobre: SobreResumen): void {
    this.seleccion.set(sobre.id);
    this.mensaje.set(null);
    this.error.set(null);
  }

  protected buscar(texto: string): void {
    this.busqueda.set(texto);
    this.usuarioElegido.set(null);
  }

  protected elegirUsuario(usuario: UsuarioResumen): void {
    this.usuarioElegido.set(usuario);
    this.mensaje.set(null);
    this.error.set(null);
  }

  protected cancelarEntrega(): void {
    this.usuarioElegido.set(null);
  }

  /** Entrega el sobre elegido al inventario del usuario elegido. */
  protected entregar(): void {
    const usuario = this.usuarioElegido();
    const sobreId = this.sobreElegido();
    const sobre = this.etiquetaElegida();

    if (!usuario || sobreId == null || this.entregando()) return;

    this.error.set(null);
    this.mensaje.set(null);
    this.entregando.set(true);

    this.expoService
      .otorgarSobre(usuario.id, sobreId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.entregando.set(false);
          this.usuarioElegido.set(null);
          this.busqueda.set('');
          this.mensaje.set(`Entregado: ${sobre} a ${usuario.nombreUsuario}.`);
          this.registrarEntrega(usuario.nombreUsuario, sobre ?? `Sobre #${sobreId}`);
        },
        error: () => {
          this.entregando.set(false);
          this.error.set('No se pudo entregar el sobre. Probá de nuevo.');
        },
      });
  }

  /** Modo automático: el próximo usuario que se registre se lleva el sobre. */
  protected dejarParaProximoRegistro(): void {
    const sobreId = this.sobreElegido();
    if (sobreId == null) {
      this.error.set('Elegí primero un sobre.');
      return;
    }

    this.guardarCambio(
      sobreId,
      true,
      `Pendiente para el próximo registro: ${this.nombreSobre(sobreId)}.`,
    );
  }

  protected desactivar(): void {
    this.seleccion.set(null);
    this.usuarioElegido.set(null);
    this.guardarCambio(null, false, 'Regalo desactivado');
  }

  private nombreSobre(id: number): string {
    const sobre = this.sobres().find((s) => s.id === id);
    return sobre ? this.etiqueta(sobre) : `Sobre #${id}`;
  }

  private registrarEntrega(usuario: string, sobre: string): void {
    const hora = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.entregas.update((lista) =>
      [{ usuario, sobre, hora }, ...lista].slice(0, MAX_ENTREGAS),
    );
  }

  private cargarPanel(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.expoService
      .obtenerConfiguracion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.configuracion.set(cfg);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo conectar con el servidor.');
          this.cargando.set(false);
        },
      });

    this.cargarSobres();
    this.cargarUsuarios();
  }

  private cargarSobres(): void {
    this.expoService
      .obtenerSobres()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sobres) => this.sobres.set(sobres),
        error: () => this.error.set('No se pudo cargar la lista de sobres.'),
      });
  }

  private cargarUsuarios(): void {
    this.expoService
      .obtenerUsuarios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        error: () =>
          this.error.set('No se pudo cargar la lista de usuarios.'),
      });
  }

  private guardarCambio(
    sobreId: number | null,
    activo: boolean,
    textoOk: string,
  ): void {
    this.error.set(null);
    this.mensaje.set(null);

    this.expoService
      .cambiarSobreRegalo(sobreId, activo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.configuracion.set(cfg);
          this.seleccion.set(null);
          this.mensaje.set(textoOk);
        },
        error: () => this.error.set('No se pudo guardar el cambio.'),
      });
  }

  /** Refresca el estado cada 5 s para ver cuándo se consumió el regalo. */
  private iniciarPolling(): void {
    timer(5000, 5000)
      .pipe(
        switchMap(() =>
          this.expoService.obtenerConfiguracion().pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cfg) => this.configuracion.set(cfg));
  }
}

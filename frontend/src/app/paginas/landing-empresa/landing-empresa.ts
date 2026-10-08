import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaqSectionEmpresa } from '../../compartidos/componentes/faq-section-empresa/faq-section-empresa';
import { Hero } from '../../compartidos/componentes/hero/hero';
import { Navbar } from '../../compartidos/componentes/navbar/navbar';
import { PlansSection } from '../../compartidos/componentes/plans-section/plans-section';
import { TeamSection } from '../../compartidos/componentes/team-section/team-section';
import {
  INTEGRANTES_EQUIPO_EMPRESA,
  PLANES_EMPRESA,
  PREGUNTAS_FRECUENTES_EMPRESA,
} from '../../datos/landing-empresa.data';

@Component({
  selector: 'app-landing-empresa',
  standalone: true,
  imports: [Navbar, Hero, PlansSection, FaqSectionEmpresa, TeamSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-empresa.html',
  styleUrl: './landing-empresa.scss',
})
export class LandingEmpresa {
  protected readonly planes = PLANES_EMPRESA;
  protected readonly preguntas = PREGUNTAS_FRECUENTES_EMPRESA;
  protected readonly integrantes = INTEGRANTES_EQUIPO_EMPRESA;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaqSectionEmpresa } from '@compartidos/componentes/empresa/faq-section-empresa/faq-section-empresa';
import { Hero } from '@compartidos/componentes/landing/hero/hero';
import { Navbar } from '@compartidos/componentes/layout/navbar/navbar';
import { Footer } from '@compartidos/componentes/layout/footer/footer';
import { PlansSection } from '@compartidos/componentes/empresa/plans-section/plans-section';
import { TeamSection } from '@compartidos/componentes/landing/team-section/team-section';
import {
  INTEGRANTES_EQUIPO,
  PLANES_EMPRESA,
  PREGUNTAS_FRECUENTES_EMPRESA,
} from '@app/datos/landing-empresa.data';

@Component({
  selector: 'app-landing-empresa',
  standalone: true,
  imports: [Navbar, Hero, PlansSection, FaqSectionEmpresa, TeamSection, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-empresa.html',
  styleUrl: './landing-empresa.scss',
})
export class LandingEmpresa {
  protected readonly planes = PLANES_EMPRESA;
  protected readonly preguntas = PREGUNTAS_FRECUENTES_EMPRESA;
  protected readonly integrantes = INTEGRANTES_EQUIPO;
}

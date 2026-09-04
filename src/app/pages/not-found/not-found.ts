import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  InjectionToken,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchModalComponent } from '../../components/search-modal/search-modal';
import { typesetMath } from '../../utils/post-content-hooks';

export type NotFoundScenarioId = 'quantum' | 'halting' | 'exercise';

interface NotFoundScenario {
  id: NotFoundScenarioId;
  icon: string;
  symbol: string;
  eyebrow: string;
  title: string;
}

export const NOT_FOUND_SCENARIOS: readonly NotFoundScenario[] = [
  {
    id: 'quantum',
    icon: 'ph-atom',
    symbol: '?',
    eyebrow: 'Quantum routing · State unobserved',
    title: 'Page Lost in the Quantum Realm',
  },
  {
    id: 'halting',
    icon: 'ph-cpu',
    symbol: '∞',
    eyebrow: 'Computability alert · Process undecidable',
    title: 'The Halting Problem',
  },
  {
    id: 'exercise',
    icon: 'ph-function',
    symbol: '∎',
    eyebrow: 'Existence theorem · Proof omitted',
    title: 'Existence Left as an Exercise',
  },
] as const;

export const NOT_FOUND_RANDOM = new InjectionToken<() => number>('NOT_FOUND_RANDOM', {
  providedIn: 'root',
  factory: () => () => Math.random(),
});

const HEAT_DEATH_YEARS = 10_000_000_000;
const YEAR_FORMATTER = new Intl.NumberFormat('en-US');

export function selectNotFoundScenario(randomValue: number): NotFoundScenario {
  const normalized = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
    : 0;
  return NOT_FOUND_SCENARIOS[Math.floor(normalized * NOT_FOUND_SCENARIOS.length)];
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, SearchModalComponent],
  templateUrl: './not-found.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './not-found.css',
})
export class NotFoundComponent implements OnDestroy {
  readonly scenario = selectNotFoundScenario(inject(NOT_FOUND_RANDOM)());
  readonly quantumEquation = String.raw`\[
    i\hbar\frac{\partial}{\partial t}\Psi(x,t)
    = \left[
      -\frac{\hbar^2}{2m}\frac{\partial^2}{\partial x^2} + V(x,t)
    \right]\Psi(x,t)
  \]`;
  readonly searchOpen = signal(false);
  readonly measurementResult = signal('');
  readonly heatDeathActive = signal(false);
  readonly heatDeathYears = signal(HEAT_DEATH_YEARS);
  readonly formattedHeatDeathYears = computed(() =>
    YEAR_FORMATTER.format(this.heatDeathYears()),
  );
  readonly reviewOpen = signal(false);

  private readonly mathContent = viewChild<ElementRef<HTMLElement>>('mathContent');
  private heatDeathTimer: number | null = null;

  constructor() {
    afterNextRender(() => {
      const mathContent = this.mathContent()?.nativeElement;
      if (mathContent) {
        void typesetMath(mathContent);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.heatDeathTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.heatDeathTimer);
    }
  }

  verifyQuantumSolution(event: Event, solution: string): void {
    event.preventDefault();
    this.measurementResult.set(
      solution.trim()
        ? 'Measurement inconclusive: V(x,t) is unspecified. The URL is probably the real problem.'
        : 'No wavefunction detected. Enter a solution before measuring.',
    );
  }

  witnessHeatDeath(): void {
    if (this.heatDeathActive()) return;

    this.heatDeathActive.set(true);
    if (typeof window === 'undefined') return;

    this.heatDeathTimer = window.setInterval(() => {
      this.heatDeathYears.update(years => Math.max(0, years - 1));
    }, 1000);
  }

  submitPaper(event: Event): void {
    event.preventDefault();
    this.reviewOpen.set(true);
  }

  closeReviewFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.reviewOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeReview(): void {
    this.reviewOpen.set(false);
  }
}

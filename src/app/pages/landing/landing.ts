import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface TermLine {
  type: 'system' | 'command' | 'output' | 'blank';
  text: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('termBody') termBody!: ElementRef<HTMLDivElement>;
  @ViewChild('termInput') termInput!: ElementRef<HTMLInputElement>;
  private platformId = inject(PLATFORM_ID);

  lines = signal<TermLine[]>([]);

  private readonly cmds: Record<string, () => TermLine[]> = {
    help: () => [
      { type: 'output', text: 'Available commands:' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  about          About me' },
      { type: 'output', text: '  research       Research interests' },
      { type: 'output', text: '  publications   Selected publications' },
      { type: 'output', text: '  education      Education background' },
      { type: 'output', text: '  experience     Work experience' },
      { type: 'output', text: '  competitions   Awards & competitions' },
      { type: 'output', text: '  links          Contact & social links' },
      { type: 'output', text: '  blog           Go to blog' },
      { type: 'output', text: '  cv             Go to CV' },
      { type: 'output', text: '  clear          Clear terminal' },
    ],
    about: () => [
      { type: 'output', text: '  Fanyi Pu (\u6FEE\u51E1\u8F76)' },
      { type: 'output', text: '  Ph.D. Student in Computer Science' },
      { type: 'output', text: '  University of Wisconsin-Madison' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  Previously: B.Sc. in Data Science & AI @ NTU Singapore' },
      { type: 'output', text: '  Research @ MMLab@NTU, supervised by Prof. Ziwei Liu' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  My research focuses on multi-modality (unified) models' },
      { type: 'output', text: '  and spatial intelligence.' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  ICPC Gold Medalist | Lichess Rapid 2086 | Chess Enthusiast' },
    ],
    research: () => [
      { type: 'output', text: '  Research Interests:' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  \u2022 Spatial Intelligence' },
      { type: 'output', text: '  \u2022 Unified Multimodal Models' },
      { type: 'output', text: '  \u2022 Deep Learning' },
      { type: 'output', text: '  \u2022 Large-scale Model Evaluation' },
    ],
    publications: () => [
      { type: 'output', text: '  Selected Publications:' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  [CVPR 2026]  SenseNova-SI: Scaling Spatial Intelligence' },
      { type: 'output', text: '               with Multimodal Foundation Models' },
      { type: 'output', text: '               Co-first author' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  [NAACL 2025] LMMs-Eval: Reality Check on the Evaluation' },
      { type: 'output', text: '               of Large Multimodal Models' },
      { type: 'output', text: '               Co-first author | \u2605 3.3K GitHub stars' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  [Preprint]   Video-MMMU: Evaluating Knowledge Acquisition' },
      { type: 'output', text: '               from Multi-Discipline Professional Videos' },
      { type: 'output', text: '               Cited by Gemini 3 Pro & GPT-5' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  [IEEE TPAMI] Otter & MIMIC-IT: Multi-Modal In-Context' },
      { type: 'output', text: '               Instruction Tuning' },
      { type: 'output', text: '               Co-first author | \u2605 3.3K GitHub stars' },
    ],
    education: () => [
      { type: 'output', text: '  University of Wisconsin-Madison       2026 - Present' },
      { type: 'output', text: '  \u2514\u2500 Ph.D. in Computer Science' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  Nanyang Technological University      2022 - 2026' },
      { type: 'output', text: '  \u2514\u2500 B.Sc. in Data Science & AI' },
      { type: 'output', text: '     CGPA: 4.63 / 5.00 (Highest Distinction)' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  UC Berkeley (Summer Session)          Jun - Aug 2024' },
      { type: 'output', text: '  \u2514\u2500 Computer Security & Game Theory, GPA: 4.00' },
    ],
    experience: () => [
      { type: 'output', text: '  LMMs-Lab                Jan 2024 - Present' },
      { type: 'output', text: '  \u2514\u2500 Core Member, Singapore' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  Synvo AI                Jan 2025 - Jul 2025' },
      { type: 'output', text: '  \u2514\u2500 Core Contributor, Singapore' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  MMLab@NTU               Jan 2025 - May 2025' },
      { type: 'output', text: '  \u2514\u2500 Research Intern' },
    ],
    competitions: () => [
      { type: 'output', text: '  ICPC (International Collegiate Programming Contest):' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  \u2022 Ranked 22nd  Asia Pacific Championship, 2024' },
      { type: 'output', text: '  \u2022 Ranked 13th  Asia Jakarta Regional, 2023' },
      { type: 'output', text: '  \u2022 Ranked 6th   Asia Manila Regional, 2022' },
      { type: 'output', text: '  \u2022 Gold Medal   Asia Kunming Regional, 2021' },
      { type: 'output', text: '  \u2022 Silver Medal Asia Nanjing Regional, 2021' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  Simon Marais Mathematics Competition:' },
      { type: 'output', text: '  \u2022 Best-in-University Prize, NTU, 2022' },
    ],
    links: () => [
      { type: 'output', text: '  Contact & Social:' },
      { type: 'blank', text: '' },
      { type: 'output', text: '  Email:     FPU001@e.ntu.edu.sg' },
      { type: 'output', text: '  GitHub:    github.com/pufanyi' },
      { type: 'output', text: '  Scholar:   scholar.google.com/citations?user=58tv6skAAAAJ' },
      { type: 'output', text: '  LinkedIn:  linkedin.com/in/pufanyi' },
      { type: 'output', text: '  X:         x.com/pufanyi' },
      { type: 'output', text: '  Lichess:   lichess.org/@/pufanyi' },
    ],
  };

  constructor(private router: Router) {
    this.lines.set([
      { type: 'system', text: "Welcome to Fanyi's homepage. Type 'help' for available commands." },
      { type: 'blank', text: '' },
      { type: 'command', text: 'about' },
      ...this.cmds['about'](),
      { type: 'blank', text: '' },
    ]);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('landing-active');
    }
  }

  ngAfterViewInit() {
    this.scrollBottom();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('landing-active');
    }
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const input = this.termInput.nativeElement;
      const cmd = input.value.trim().toLowerCase();
      input.value = '';
      if (!cmd) return;
      this.exec(cmd);
    }
  }

  exec(cmd: string) {
    if (cmd === 'clear') {
      this.lines.set([]);
      return;
    }
    if (cmd === 'blog') {
      this.router.navigate(['/blog']);
      return;
    }
    if (cmd === 'cv') {
      this.router.navigate(['/cv']);
      return;
    }

    const updated = [...this.lines()];
    updated.push({ type: 'command', text: cmd });

    const handler = this.cmds[cmd];
    if (handler) {
      updated.push(...handler());
    } else {
      updated.push({
        type: 'output',
        text: `  Command not found: ${cmd}. Type 'help' for commands.`,
      });
    }
    updated.push({ type: 'blank', text: '' });
    this.lines.set(updated);
    setTimeout(() => this.scrollBottom(), 0);
  }

  focus() {
    this.termInput?.nativeElement.focus();
  }

  private scrollBottom() {
    if (this.termBody) {
      const el = this.termBody.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}

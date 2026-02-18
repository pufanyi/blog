import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { LanguageService, Lang } from '../../../../services/language.service';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';

@Component({
  selector: 'app-language-switcher',
  imports: [AutoAnimateDirective],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  readonly langService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly open = signal(false);

  readonly languages: { code: Lang; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
  ];

  readonly triggerLabel: Record<Lang, string> = {
    en: 'Language: English',
    zh: '语言：中文',
    ja: '言語：日本語',
  };

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  select(lang: Lang): void {
    this.langService.set(lang);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}

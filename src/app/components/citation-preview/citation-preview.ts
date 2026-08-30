import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-citation-preview',
  templateUrl: './citation-preview.html',
  styleUrl: './citation-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitationPreviewComponent {
  readonly entryHtml = input.required<SafeHtml>();
  readonly title = input<string | null>(null);
  readonly authors = input<string | null>(null);
  readonly year = input<string | null>(null);
  readonly abstract = input<string | null>(null);
  readonly paperUrl = input<string | null>(null);
  readonly referenceHref = input.required<string>();
  readonly closeRequested = output<boolean>();
}

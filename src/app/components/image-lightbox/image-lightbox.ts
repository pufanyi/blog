import { Component, ElementRef, afterNextRender, input, viewChild, OnDestroy } from '@angular/core';
import mediumZoom, { Zoom } from 'medium-zoom';

@Component({
  selector: 'app-image-lightbox',
  templateUrl: './image-lightbox.html',
  styleUrl: './image-lightbox.css',
})
export class ImageLightboxComponent implements OnDestroy {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly width = input<string | number>();
  readonly height = input<string | number>();
  readonly imgClass = input<string>('');
  readonly avif = input<string>();
  readonly webp = input<string>();
  readonly loading = input<'eager' | 'lazy'>('eager');

  private readonly img = viewChild.required<ElementRef<HTMLImageElement>>('img');
  private zoom: Zoom | null = null;

  constructor() {
    afterNextRender(() => {
      this.zoom = mediumZoom(this.img().nativeElement, {
        margin: 24,
        background: 'rgba(0, 0, 0, 0.85)',
      });
    });
  }

  ngOnDestroy() {
    this.zoom?.detach();
  }
}

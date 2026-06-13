import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';
import mediumZoom, { Zoom } from 'medium-zoom';

@Component({
  selector: 'app-image-lightbox',
  imports: [NgOptimizedImage],
  templateUrl: './image-lightbox.html',
  styleUrl: './image-lightbox.css',
})
export class ImageLightboxComponent implements OnDestroy {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly width = input.required<string | number>();
  readonly height = input.required<string | number>();
  readonly imgClass = input<string>('');
  readonly loading = input<'eager' | 'lazy'>('eager');
  readonly priority = input(false, { transform: booleanAttribute });
  readonly preventAncestorNavigation = input(false, { transform: booleanAttribute });
  readonly sizes = input<string>();

  private readonly img = viewChild.required<ElementRef<HTMLImageElement>>('img');
  private zoom: Zoom | null = null;

  constructor() {
    afterNextRender(() => {
      this.zoom = mediumZoom(this.img().nativeElement, {
        margin: 24,
        background: 'color-mix(in srgb, var(--ctp-crust) 86%, var(--ctp-transparent))',
      });
    });
  }

  ngOnDestroy() {
    this.zoom?.detach();
  }

  onImageClick(event: MouseEvent): void {
    if (this.preventAncestorNavigation()) {
      event.preventDefault();
    }
  }
}

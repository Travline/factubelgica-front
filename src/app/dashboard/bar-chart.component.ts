import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface BarChartDataset {
  label: string;
  values: number[];
  color: string;
  hoverColor?: string;
}

export interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [],
  template: `
    <div class="bar-chart-wrapper">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .bar-chart-wrapper {
      width: 100%;
      position: relative;
    }
    canvas {
      width: 100% !important;
      display: block;
    }
  `],
})
export class BarChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() data: BarChartData = { labels: [], datasets: [] };
  @Input() height = 240;
  @Input() currency = false;
  @Input() title = '';

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit() {
    if (this.isBrowser) this.draw();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isBrowser && this.canvasRef) this.draw();
  }

  private draw() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { labels, datasets } = this.data;
    if (!labels?.length || !datasets?.length) {
      // Draw empty state
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth || 600;
      canvas.width = W * dpr;
      canvas.height = this.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, this.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos disponibles', W / 2, this.height / 2);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 600;
    const H = this.height;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Layout
    const padLeft = 72;
    const padRight = 20;
    const padTop = 16;
    const padBottom = 50; // room for labels + legend
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;

    // Determine max value across all datasets
    const allValues = datasets.flatMap(d => d.values);
    const maxVal = Math.max(...allValues, 1);
    const niceMax = this.niceNumber(maxVal, 5);
    const step = niceMax / 5;

    // Draw grid lines and y-axis labels
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const val = step * i;
      const y = padTop + chartH - (val / niceMax) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
      const label = this.currency
        ? `S/ ${this.formatK(val)}`
        : this.formatK(val);
      ctx.fillText(label, padLeft - 6, y + 4);
    }

    // Draw bars
    const n = labels.length;
    const dsCount = datasets.length;
    const groupW = chartW / n;
    const barPad = groupW * 0.15;
    const barGroupW = groupW - barPad * 2;
    const barW = barGroupW / dsCount;

    datasets.forEach((ds, di) => {
      ds.values.forEach((val, li) => {
        const barH = (val / niceMax) * chartH;
        const x = padLeft + li * groupW + barPad + di * barW;
        const y = padTop + chartH - barH;

        // Gradient fill
        const grad = ctx.createLinearGradient(x, y, x, padTop + chartH);
        grad.addColorStop(0, ds.color);
        grad.addColorStop(1, this.transparentize(ds.color, 0.5));
        ctx.fillStyle = grad;

        // Rounded top
        const radius = Math.min(4, barW / 2, barH);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
        ctx.lineTo(x + barW, padTop + chartH);
        ctx.lineTo(x, padTop + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      });
    });

    // X-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, li) => {
      const x = padLeft + li * groupW + groupW / 2;
      const y = padTop + chartH + 16;
      ctx.fillText(label, x, y);
    });

    // Legend
    if (datasets.length > 1) {
      let lx = padLeft;
      const ly = H - 14;
      datasets.forEach(ds => {
        ctx.fillStyle = ds.color;
        ctx.fillRect(lx, ly - 9, 12, 10);
        ctx.fillStyle = '#475569';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ds.label, lx + 16, ly);
        lx += ctx.measureText(ds.label).width + 32;
      });
    }
  }

  private niceNumber(val: number, steps: number): number {
    if (val === 0) return steps;
    const rough = val / steps;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const nice = Math.ceil(rough / pow) * pow;
    return nice * steps;
  }

  private formatK(val: number): string {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toFixed(0);
  }

  private transparentize(hex: string, alpha: number): string {
    // hex to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}

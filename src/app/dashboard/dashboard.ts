import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DashboardService,
  SalesReportResponse,
  TaxReportResponse,
  ProductSalesReportResponse,
  ProductItemResponse,
} from './dashboard.service';
import { BarChartComponent, BarChartData } from './bar-chart.component';

type Tab = 'sales' | 'taxes' | 'product';

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BarChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private svc = inject(DashboardService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ── Navigation ────────────────────────────────────────────────────────────
  activeTab: Tab = 'sales';

  // ── Date selectors (shared across sales/taxes, separate for product) ──────
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1; // 1-12

  productYear = new Date().getFullYear();
  productMonth = new Date().getMonth() + 1;

  years: number[] = [];
  months = MONTH_NAMES.map((name, i) => ({ value: i + 1, name }));

  // ── Products selector ─────────────────────────────────────────────────────
  products: ProductItemResponse[] = [];
  selectedProductId: number | null = null;
  loadingProducts = false;

  // ── Data ──────────────────────────────────────────────────────────────────
  salesData: SalesReportResponse | null = null;
  taxData: TaxReportResponse | null = null;
  productData: ProductSalesReportResponse | null = null;

  loadingSales = false;
  loadingTax = false;
  loadingProduct = false;

  errorSales = '';
  errorTax = '';
  errorProduct = '';

  // ── Chart data ────────────────────────────────────────────────────────────
  salesYearlyChart: BarChartData = { labels: [], datasets: [] };
  salesMonthlyChart: BarChartData = { labels: [], datasets: [] };
  taxYearlyChart: BarChartData = { labels: [], datasets: [] };
  taxMonthlyChart: BarChartData = { labels: [], datasets: [] };
  productYearlyChart: BarChartData = { labels: [], datasets: [] };
  productDailyChart: BarChartData = { labels: [], datasets: [] };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    // Build year options: current year down to 5 years ago
    const now = new Date().getFullYear();
    for (let y = now; y >= now - 5; y--) this.years.push(y);

    if (isPlatformBrowser(this.platformId)) {
      this.loadSales();
      this.loadTax();
      this.loadProductsList();
    }
  }

  // ── Tab switch ────────────────────────────────────────────────────────────
  setTab(tab: Tab) {
    this.activeTab = tab;
    if (tab === 'sales' && !this.salesData) this.loadSales();
    if (tab === 'taxes' && !this.taxData) this.loadTax();
    if (tab === 'product' && this.selectedProductId && !this.productData) this.loadProduct();
  }

  // ── Load Sales ────────────────────────────────────────────────────────────
  loadSales() {
    this.loadingSales = true;
    this.errorSales = '';
    this.salesData = null;
    this.svc.getSalesReport(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.salesData = data;
        this.buildSalesCharts(data);
        this.loadingSales = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorSales = 'Error al cargar el reporte de ventas.';
        this.loadingSales = false;
        this.cdr.detectChanges();
      },
    });
  }

  private buildSalesCharts(data: SalesReportResponse) {
    // Yearly: net vs gross per month
    const yearlySorted = [...(data.yearlySales || [])].sort((a, b) => a.month - b.month);
    this.salesYearlyChart = {
      labels: yearlySorted.map(m => MONTH_NAMES[m.month - 1] ?? `M${m.month}`),
      datasets: [
        {
          label: 'Ventas Netas',
          values: yearlySorted.map(m => m.netSales),
          color: '#6366f1',
        },
        {
          label: 'Ventas Brutas',
          values: yearlySorted.map(m => m.grossSales),
          color: '#22d3ee',
        },
      ],
    };

    // Monthly: net vs gross per day
    const monthlySorted = [...(data.monthlySales || [])].sort((a, b) => a.day - b.day);
    this.salesMonthlyChart = {
      labels: monthlySorted.map(d => `${d.day}`),
      datasets: [
        {
          label: 'Ventas Netas',
          values: monthlySorted.map(d => d.netSales),
          color: '#6366f1',
        },
        {
          label: 'Ventas Brutas',
          values: monthlySorted.map(d => d.grossSales),
          color: '#22d3ee',
        },
      ],
    };
  }

  // ── Load Tax ──────────────────────────────────────────────────────────────
  loadTax() {
    this.loadingTax = true;
    this.errorTax = '';
    this.taxData = null;
    this.svc.getTaxReport(this.selectedYear, this.selectedMonth).subscribe({
      next: (data) => {
        this.taxData = data;
        this.buildTaxCharts(data);
        this.loadingTax = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorTax = 'Error al cargar el reporte de impuestos.';
        this.loadingTax = false;
        this.cdr.detectChanges();
      },
    });
  }

  private buildTaxCharts(data: TaxReportResponse) {
    const yearlySorted = [...(data.yearlyTaxes || [])].sort((a, b) => a.month - b.month);
    this.taxYearlyChart = {
      labels: yearlySorted.map(m => MONTH_NAMES[m.month - 1] ?? `M${m.month}`),
      datasets: [
        {
          label: 'Impuestos',
          values: yearlySorted.map(m => m.taxAmount),
          color: '#f59e0b',
        },
      ],
    };

    const monthlySorted = [...(data.monthlyTaxes || [])].sort((a, b) => a.day - b.day);
    this.taxMonthlyChart = {
      labels: monthlySorted.map(d => `${d.day}`),
      datasets: [
        {
          label: 'Impuestos Diarios',
          values: monthlySorted.map(d => d.taxAmount),
          color: '#f59e0b',
        },
      ],
    };
  }

  // ── Load Products list ────────────────────────────────────────────────────
  loadProductsList() {
    this.loadingProducts = true;
    this.svc.getProducts().subscribe({
      next: (data) => {
        this.products = data || [];
        if (this.products.length > 0 && this.selectedProductId == null) {
          this.selectedProductId = this.products[0].productId;
        }
        this.loadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingProducts = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Load Product report ───────────────────────────────────────────────────
  loadProduct() {
    if (!this.selectedProductId) return;
    this.loadingProduct = true;
    this.errorProduct = '';
    this.productData = null;
    this.svc.getProductSalesReport(this.selectedProductId, this.productYear, this.productMonth).subscribe({
      next: (data) => {
        this.productData = data;
        this.buildProductCharts(data);
        this.loadingProduct = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorProduct = 'Error al cargar el reporte del producto.';
        this.loadingProduct = false;
        this.cdr.detectChanges();
      },
    });
  }

  private buildProductCharts(data: ProductSalesReportResponse) {
    const monthlySorted = [...(data.monthlySales || [])].sort((a, b) => a.month - b.month);
    this.productYearlyChart = {
      labels: monthlySorted.map(m => MONTH_NAMES[m.month - 1] ?? `M${m.month}`),
      datasets: [
        {
          label: 'Cantidad',
          values: monthlySorted.map(m => m.quantity),
          color: '#10b981',
        },
        {
          label: 'Ventas Netas',
          values: monthlySorted.map(m => m.netSales),
          color: '#6366f1',
        },
      ],
    };

    const dailySorted = [...(data.dailySales || [])].sort((a, b) => a.day - b.day);
    this.productDailyChart = {
      labels: dailySorted.map(d => `${d.day}`),
      datasets: [
        {
          label: 'Cantidad',
          values: dailySorted.map(d => d.quantity),
          color: '#10b981',
        },
        {
          label: 'Ventas Netas',
          values: dailySorted.map(d => d.netSales),
          color: '#6366f1',
        },
      ],
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  onDateChange() {
    if (this.activeTab === 'sales') this.loadSales();
    if (this.activeTab === 'taxes') this.loadTax();
  }

  onProductDateChange() {
    if (this.selectedProductId) this.loadProduct();
  }

  onProductChange() {
    this.productData = null;
    if (this.selectedProductId) this.loadProduct();
  }

  formatCurrency(val: number | undefined | null): string {
    if (val == null) return 'S/ 0.00';
    return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  monthName(m: number): string {
    return MONTH_NAMES[m - 1] ?? `Mes ${m}`;
  }

  get today(): string {
    return new Date().toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

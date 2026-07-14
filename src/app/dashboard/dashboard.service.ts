import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Types from admin-dashboard-controller spec ──────────────────────────────

export interface MonthlyTaxMetric {
  month: number;
  taxAmount: number;
}

export interface DailyTaxMetric {
  day: number;
  taxAmount: number;
}

export interface TaxReportResponse {
  year: number;
  month: number;
  totalTaxesYear: number;
  totalTaxesMonth: number;
  yearlyTaxes: MonthlyTaxMetric[];
  monthlyTaxes: DailyTaxMetric[];
}

export interface MonthlySalesMetric {
  month: number;
  netSales: number;
  grossSales: number;
}

export interface DailySalesMetric {
  day: number;
  netSales: number;
  grossSales: number;
}

export interface SalesReportResponse {
  year: number;
  month: number;
  totalNetSalesYear: number;
  totalGrossSalesYear: number;
  totalNetSalesMonth: number;
  totalGrossSalesMonth: number;
  yearlySales: MonthlySalesMetric[];
  monthlySales: DailySalesMetric[];
}

export interface MonthlyProductSalesMetric {
  month: number;
  quantity: number;
  netSales: number;
}

export interface DailyProductSalesMetric {
  day: number;
  quantity: number;
  netSales: number;
}

export interface ProductSalesReportResponse {
  year: number;
  month: number;
  productId: number;
  description: string;
  currentNetPrice: number;
  totalQuantityYear: number;
  totalNetSalesYear: number;
  totalQuantityMonth: number;
  totalNetSalesMonth: number;
  monthlySales: MonthlyProductSalesMetric[];
  dailySales: DailyProductSalesMetric[];
}

// ── Types from user-product-controller spec ──────────────────────────────────

export interface ProductItemResponse {
  productId: number;
  description: string;
  netPrice: number;
  active: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSalesReport(year?: number, month?: number): Observable<SalesReportResponse> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year.toString());
    if (month != null) params = params.set('month', month.toString());
    return this.http.get<SalesReportResponse>(`${this.base}/a-role/dashboard/sales`, {
      params,
      withCredentials: true,
    });
  }

  getTaxReport(year?: number, month?: number): Observable<TaxReportResponse> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year.toString());
    if (month != null) params = params.set('month', month.toString());
    return this.http.get<TaxReportResponse>(`${this.base}/a-role/dashboard/taxes`, {
      params,
      withCredentials: true,
    });
  }

  getProductSalesReport(
    id: number,
    year?: number,
    month?: number,
  ): Observable<ProductSalesReportResponse> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year.toString());
    if (month != null) params = params.set('month', month.toString());
    return this.http.get<ProductSalesReportResponse>(`${this.base}/a-role/dashboard/products/${id}`, {
      params,
      withCredentials: true,
    });
  }

  getProducts(limit = 200): Observable<ProductItemResponse[]> {
    const params = new HttpParams().set('lastId', '0').set('limit', limit.toString());
    return this.http.get<ProductItemResponse[]>(`${this.base}/u-role/products`, {
      params,
      withCredentials: true,
    });
  }
}

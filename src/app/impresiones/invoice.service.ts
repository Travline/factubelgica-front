import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InvoiceItem {
  itemId: number;
  productId: number;
  quantity: number;
  description: string;
  netPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  invoiceId: string;
  invoiceNumber: number;
  infoId: number;
  userId: string;
  issueDate: string;
  dueDate: string;
  vatRate: number;
  paymentDate?: string;
  status: string;
  created: string;
  items: InvoiceItem[];
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/u-role/invoices`;

  constructor(private http: HttpClient) { }

  getInvoiceById(id: string): Observable<InvoiceData> {
    return this.http.get<InvoiceData>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
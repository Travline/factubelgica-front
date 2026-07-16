import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth';
import { environment } from '../../environments/environment';

export interface InvoiceItemResponse {
  itemId: number;
  productId: number;
  quantity: number;
  description: string;
  netPrice: number;
  lineTotal: number;
}

export interface InvoiceResponse {
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
  items: InvoiceItemResponse[];
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

interface Client {
  clientId: number;
  legalName: string;
}

interface Product {
  productId: number;
  description: string;
  netPrice: number;
}

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas.html',
  styleUrl: './facturas.css',
})
export class Facturas implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  invoices: InvoiceResponse[] = [];
  isLoading = false;

  // Pagination cursor state
  initialUuid = '';
  cursors: string[] = [];
  currentPageIndex = 0;
  limit = 10;
  hasMore = true;

  // Invoice creation form state
  showCreateModal = false;
  clientsList: Client[] = [];
  productsList: Product[] = [];

  selectedClientId: number | null = null;
  dueDate = '';
  vatRate = 21; // Default VAT rate
  selectedItems: { productId: number; quantity: number }[] = [];

  createError = '';
  isCreating = false;

  // Invoice Status update state
  showStatusModal = false;
  showDetailModal = false;
  selectedInvoice: InvoiceResponse | null = null;
  newStatus = '';
  isUpdatingStatus = false;
  statusError = '';

  ngOnInit() {
    this.initialUuid = '00000000-0000-7000-8000-000000000000';
    this.cursors = [this.initialUuid];

    if (isPlatformBrowser(this.platformId)) {
      this.fetchInvoices(this.initialUuid);
      this.loadClientsAndProducts();
    }
  }

  generateUuidV7(): string {
    const now = Date.now();
    const hex = (val: number, len: number) => val.toString(16).padStart(len, '0');
    // UUIDv7 structure: 48-bit timestamp, 4-bit version (7), 12-bit random, 2-bit variant, 62-bit random
    const random1 = Math.floor(Math.random() * 0x1000);
    const random2 = Math.floor(Math.random() * 0x100000000);
    const random3 = Math.floor(Math.random() * 0x40000000); // 30 bits

    // Construct parts
    const timeHex = hex(now, 12);
    const verRand = '7' + hex(random1, 3);
    // Variant 8-b (10xx)
    const varRand = hex(0x80000000 + random3, 8);
    const restRand = hex(random2, 8);

    return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${verRand}-${varRand.slice(0, 4)}-${varRand.slice(4, 8)}${restRand}`;
  }

  fetchInvoices(lastId: string) {
    this.isLoading = true;
    const url = `${environment.apiUrl}/u-role/invoices?lastId=${lastId}&limit=${this.limit}`;

    this.http.get<InvoiceResponse[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        this.invoices = data || [];
        this.isLoading = false;
        this.hasMore = this.invoices.length === this.limit;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching invoices', err);
        this.isLoading = false;
        this.invoices = [];
        this.hasMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.invoices.length > 0 && this.hasMore) {
      const lastInvoice = this.invoices[this.invoices.length - 1];
      const nextCursor = lastInvoice.invoiceId;
      this.currentPageIndex++;
      this.cursors[this.currentPageIndex] = nextCursor;
      this.fetchInvoices(nextCursor);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      const prevCursor = this.cursors[this.currentPageIndex];
      this.fetchInvoices(prevCursor);
    }
  }

  loadClientsAndProducts() {
    // Load clients
    this.http.get<Client[]>(`${environment.apiUrl}/u-role/clients?limit=100`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.clientsList = data || [];
        this.cdr.detectChanges();
      }
    });

    // Load products
    this.http.get<Product[]>(`${environment.apiUrl}/u-role/products?limit=100`, { withCredentials: true }).subscribe({
      next: (data) => {
        this.productsList = data || [];
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.selectedClientId = null;
    this.dueDate = '';
    this.vatRate = 21;
    this.selectedItems = [{ productId: 0, quantity: 1 }];
    this.createError = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  addItem() {
    this.selectedItems.push({ productId: 0, quantity: 1 });
  }

  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }

  createInvoice() {
    if (!this.selectedClientId || !this.dueDate || this.selectedItems.length === 0) {
      this.createError = 'Por favor complete todos los campos obligatorios y agregue al menos un producto.';
      return;
    }

    const invalidItems = this.selectedItems.some(item => !item.productId || item.quantity <= 0);
    if (invalidItems) {
      this.createError = 'Verifique que todos los productos y cantidades sean válidos.';
      return;
    }

    this.isCreating = true;
    this.createError = '';

    const url = `${environment.apiUrl}/u-role/invoices`;
    const payload = {
      clientId: this.selectedClientId,
      dueDate: this.dueDate,
      vatRate: this.vatRate,
      items: this.selectedItems
    };

    this.http.post<InvoiceResponse>(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateModal = false;
        // Reload list
        this.currentPageIndex = 0;
        this.cursors = [this.initialUuid];
        this.fetchInvoices(this.initialUuid);
      },
      error: (err) => {
        console.error('Error creating invoice', err);
        this.isCreating = false;
        this.createError = 'Error al registrar la factura. Inténtelo nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  openStatusModal(invoice: InvoiceResponse) {
    this.selectedInvoice = invoice;
    this.newStatus = invoice.status;
    this.showStatusModal = true;
    this.statusError = '';
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedInvoice = null;
  }

  updateStatus() {
    if (!this.selectedInvoice) return;

    this.isUpdatingStatus = true;
    this.statusError = '';

    const url = `${environment.apiUrl}/u-role/invoices/${this.selectedInvoice.invoiceId}/status`;
    const payload = {
      status: this.newStatus
    };

    this.http.put<InvoiceResponse>(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        this.showStatusModal = false;
        // Refresh current page
        this.fetchInvoices(this.cursors[this.currentPageIndex]);
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.isUpdatingStatus = false;
        this.statusError = 'Error al actualizar el estado.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteInvoice(invoiceId: string) {
    const reason = prompt('Para anular (eliminar) esta factura, por favor ingrese el motivo o razón de la Nota de Crédito:');
    if (reason === null) return; // Cancelled by user
    if (!reason.trim()) {
      alert('Debe ingresar un motivo válido para anular la factura.');
      return;
    }

    const url = `${environment.apiUrl}/a-role/credit-notes`;
    const payload = {
      invoiceId: invoiceId,
      reason: reason.trim()
    };

    this.http.post(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        alert('Factura anulada con éxito mediante Nota de Crédito.');
        // Refresh current page
        this.fetchInvoices(this.cursors[this.currentPageIndex]);
      },
      error: (err) => {
        console.error('Error issuing credit note for invoice deletion', err);
        alert('Error al intentar anular la factura con Nota de Crédito.');
      }
    });
  }

  openDetailModal(invoice: InvoiceResponse) {
    this.selectedInvoice = invoice;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedInvoice = null;
  }
}


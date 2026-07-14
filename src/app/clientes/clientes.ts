import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth';
import { environment } from '../../environments/environment';

export interface ClientResponse {
  clientId: number;
  vatNumber: string;
  active: boolean;
  infoId?: number;
  legalName: string;
  email?: string;
  address?: string;
  phone?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  clients: ClientResponse[] = [];
  isLoading = false;

  // Pagination cursor state
  cursors: number[] = [0];
  currentPageIndex = 0;
  limit = 10;
  hasMore = true;

  // Modal Create state
  showCreateModal = false;
  newVatNumber = '';
  newLegalName = '';
  newEmail = '';
  newAddress = '';
  newPhone = '';
  createError = '';
  isCreating = false;

  // Modal Edit state
  showEditModal = false;
  editingClientId: number | null = null;
  editLegalName = '';
  editEmail = '';
  editAddress = '';
  editPhone = '';
  editActive = true;
  editError = '';
  isUpdating = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchClients(0);
    }
  }

  fetchClients(lastId: number) {
    this.isLoading = true;
    const url = `${environment.apiUrl}/u-role/clients?lastId=${lastId}&limit=${this.limit}`;

    this.http.get<ClientResponse[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        this.clients = data || [];
        this.isLoading = false;
        this.hasMore = this.clients.length === this.limit;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching clients', err);
        this.isLoading = false;
        this.clients = [];
        this.hasMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.clients.length > 0 && this.hasMore) {
      const lastClient = this.clients[this.clients.length - 1];
      const nextCursor = lastClient.clientId;
      this.currentPageIndex++;
      this.cursors[this.currentPageIndex] = nextCursor;
      this.fetchClients(nextCursor);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      const prevCursor = this.cursors[this.currentPageIndex];
      this.fetchClients(prevCursor);
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newVatNumber = '';
    this.newLegalName = '';
    this.newEmail = '';
    this.newAddress = '';
    this.newPhone = '';
    this.createError = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  createClient() {
    if (!this.newLegalName || !this.newVatNumber) {
      this.createError = 'Razón Social y RUC/DNI son obligatorios.';
      return;
    }

    this.isCreating = true;
    this.createError = '';
    const url = `${environment.apiUrl}/u-role/clients`;
    const payload = {
      vatNumber: this.newVatNumber,
      legalName: this.newLegalName,
      email: this.newEmail || undefined,
      address: this.newAddress || undefined,
      phone: this.newPhone || undefined
    };

    this.http.post<ClientResponse>(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateModal = false;
        // Reload first page
        this.currentPageIndex = 0;
        this.cursors = [0];
        this.fetchClients(0);
      },
      error: (err) => {
        console.error('Error creating client', err);
        this.isCreating = false;
        this.createError = 'Error al registrar el cliente. Verifique los datos e intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(client: ClientResponse) {
    this.showEditModal = true;
    this.editingClientId = client.clientId;
    this.editLegalName = client.legalName;
    this.editEmail = client.email || '';
    this.editAddress = client.address || '';
    this.editPhone = client.phone || '';
    this.editActive = client.active;
    this.editError = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingClientId = null;
  }

  updateClient() {
    if (!this.editingClientId) return;
    if (!this.editLegalName) {
      this.editError = 'La Razón Social es obligatoria.';
      return;
    }

    this.isUpdating = true;
    this.editError = '';
    const url = `${environment.apiUrl}/u-role/clients/${this.editingClientId}`;
    const payload = {
      legalName: this.editLegalName,
      email: this.editEmail || undefined,
      address: this.editAddress || undefined,
      phone: this.editPhone || undefined,
      active: this.editActive
    };

    this.http.put<ClientResponse>(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.isUpdating = false;
        this.showEditModal = false;
        // Refresh current page
        const currentCursor = this.cursors[this.currentPageIndex];
        this.fetchClients(currentCursor);
      },
      error: (err) => {
        console.error('Error updating client', err);
        this.isUpdating = false;
        this.editError = 'Error al actualizar el cliente. Intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }
}

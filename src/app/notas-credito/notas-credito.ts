import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface CreditNoteResponse {
  noteId: string;
  invoiceId: string;
  noteNumber: number;
  issueDate: string;
  reason: string;
  created: string;
}

@Component({
  selector: 'app-notas-credito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas-credito.html',
  styleUrl: './notas-credito.css',
})
export class NotasCreditoComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  notes: CreditNoteResponse[] = [];
  isLoading = false;

  // Pagination — same cursor strategy as Facturas (UUID-based lastId)
  readonly INITIAL_ID = '00000000-0000-0000-0000-000000000000';
  cursors: (string | null)[] = [null]; // null = first page (no lastId sent)
  currentPageIndex = 0;
  readonly limit = 10;
  hasMore = true;

  // Detail modal
  showDetailModal = false;
  selectedNote: CreditNoteResponse | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchNotes(null);
    }
  }

  fetchNotes(lastId: string | null) {
    this.isLoading = true;

    let url = `${environment.apiUrl}/a-role/credit-notes?limit=${this.limit}`;
    if (lastId) {
      url += `&lastId=${lastId}`;
    }

    this.http.get<CreditNoteResponse[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        this.notes = data || [];
        this.hasMore = this.notes.length === this.limit;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching credit notes', err);
        this.notes = [];
        this.hasMore = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  nextPage() {
    if (this.notes.length > 0 && this.hasMore) {
      const lastNote = this.notes[this.notes.length - 1];
      const nextCursor = lastNote.noteId;
      this.currentPageIndex++;
      this.cursors[this.currentPageIndex] = nextCursor;
      this.fetchNotes(nextCursor);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      const prevCursor = this.cursors[this.currentPageIndex];
      this.fetchNotes(prevCursor ?? null);
    }
  }

  openDetailModal(note: CreditNoteResponse) {
    this.selectedNote = note;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedNote = null;
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  shortId(id: string): string {
    if (!id) return '—';
    return id.split('-')[0].toUpperCase();
  }
}

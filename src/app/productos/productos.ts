import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth';
import { environment } from '../../environments/environment';

export interface ProductItem {
  productId: number;
  description: string;
  netPrice: number;
  active: boolean;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class ProductosComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  products: ProductItem[] = [];
  isLoading = false;

  // Pagination cursor state
  cursors: number[] = [0];
  currentPageIndex = 0;
  limit = 10;
  hasMore = true;

  // Admin Create Product Form state
  showCreateModal = false;
  newProductDescription = '';
  newProductPrice: number | null = null;
  isCreating = false;
  createError = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchProducts(0);
    }
  }

  isAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return role?.toLowerCase() === 'admin';
  }

  fetchProducts(lastId: number) {
    this.isLoading = true;
    const url = `${environment.apiUrl}/u-role/products?lastId=${lastId}&limit=${this.limit}`;
    
    this.http.get<ProductItem[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        this.products = data || [];
        this.isLoading = false;
        
        // If we get fewer items than the limit, there are no more pages
        this.hasMore = this.products.length === this.limit;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.isLoading = false;
        this.products = [];
        this.hasMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextPage() {
    if (this.products.length > 0 && this.hasMore) {
      const lastProduct = this.products[this.products.length - 1];
      const nextCursor = lastProduct.productId;
      this.currentPageIndex++;
      this.cursors[this.currentPageIndex] = nextCursor;
      this.fetchProducts(nextCursor);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      const prevCursor = this.cursors[this.currentPageIndex];
      this.fetchProducts(prevCursor);
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newProductDescription = '';
    this.newProductPrice = null;
    this.createError = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  createProduct() {
    if (!this.newProductDescription || this.newProductPrice === null || this.newProductPrice < 0) {
      this.createError = 'Por favor complete todos los campos correctamente.';
      return;
    }

    this.isCreating = true;
    this.createError = '';
    const url = `${environment.apiUrl}/a-role/products`;
    const payload = {
      description: this.newProductDescription,
      netPrice: this.newProductPrice
    };

    this.http.post(url, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateModal = false;
        // Reload the first page of products
        this.currentPageIndex = 0;
        this.cursors = [0];
        this.fetchProducts(0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating product', err);
        this.isCreating = false;
        this.createError = 'Error al crear el producto. Inténtelo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}

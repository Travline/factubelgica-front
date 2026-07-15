import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InvoiceService, InvoiceData } from './invoice.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  invoice?: InvoiceData;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceService.getInvoiceById(id).subscribe({
        next: (data) => {
          this.invoice = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar la factura. Verifica el ID.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de factura inválido.';
      this.loading = false;
    }
  }

  printInvoice(): void {
    window.print();
  }
}
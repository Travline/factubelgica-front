import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importa ChangeDetectorRef
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
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef // 2. Inyéctalo aquí
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceService.getInvoiceById(id).subscribe({
        next: (data) => {
          this.invoice = data;
          this.loading = false;

          console.log("¡Llegaron los datos!", data);
          this.invoice = data;
          this.loading = false;
          this.cdr.detectChanges();

          // 3. Forzar a Angular a redibujar la pantalla con los nuevos datos
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudo cargar la factura. Verifica el ID.';
          this.loading = false;
          this.cdr.detectChanges(); // Forzar renderizado en error también
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
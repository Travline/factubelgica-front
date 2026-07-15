import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { LayoutComponent } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { Clientes } from './clientes/clientes';
import { Facturas } from './facturas/facturas';
import { ProductosComponent } from './productos/productos';
import { NotasCreditoComponent } from './notas-credito/notas-credito';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clientes', component: Clientes },
      { path: 'facturas', component: Facturas },
      { path: 'productos', component: ProductosComponent },
      { path: 'notas-credito', component: NotasCreditoComponent },
    ]
  }
];

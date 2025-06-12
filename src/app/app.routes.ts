import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AtlComponent } from './components/atl-admin-view/atl.component';
import { ListadoTransformacionesComponent } from './listado-transformaciones/listado-transformaciones.component';
import { AtlClientViewComponent } from './components/atl-client-view/atl-client-view.component';
import { AdminGuard } from './guards/auth.guard';

//import { PruebaComponent } from './prueba/prueba.component';

export const routes: Routes = [
  { path: '', component: LoginComponent }, // Ruta principal
  { path: 'atlAdminView', component: AtlComponent, canActivate: [AdminGuard] }, // Ruta para el componente Prueba
  { path: 'list', component: ListadoTransformacionesComponent }, // Ruta para el componente Prueba
  { path: 'login', component: LoginComponent }, // Ruta para el componente Login
  { path: 'atlUserView', component: AtlClientViewComponent }, // Ruta para el componente Login

];

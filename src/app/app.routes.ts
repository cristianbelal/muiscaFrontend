import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AtlComponent } from './components/atl/atl.component';
import { ListadoTransformacionesComponent } from './listado-transformaciones/listado-transformaciones.component';

//import { PruebaComponent } from './prueba/prueba.component';

export const routes: Routes = [
  { path: '', component: AtlComponent }, // Ruta principal
  { path: 'atl', component: AtlComponent }, // Ruta para el componente Prueba
  { path: 'list', component: ListadoTransformacionesComponent }, // Ruta para el componente Prueba
  { path: 'login', component: LoginComponent }, // Ruta para el componente Login

];

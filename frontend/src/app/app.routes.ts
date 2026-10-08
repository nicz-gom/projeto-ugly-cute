import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Home } from './components/home/home';
import { PanelAdm } from './components/panel-adm/panel-adm';


export const routes: Routes = [
    {path: '', component: Home},
    {path: 'login', component: Login },
    {path: 'admin', component: PanelAdm }
];

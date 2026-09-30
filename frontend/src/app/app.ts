import { Component, signal } from '@angular/core';
import {Home} from './components/home/home';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Home, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  
}

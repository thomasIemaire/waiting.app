import { Component, inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { BrandComponent } from "./components/brand/brand.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BrandComponent, SidebarComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  ngOnInit() {  }

}

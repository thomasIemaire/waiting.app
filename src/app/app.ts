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

  private themeService: ThemeService = inject(ThemeService);

  ngOnInit() {
    console.log(
      "%c🚀  Outil développé par  %cThomas Lemaire",
      [
        "padding:8px 12px",
        "background:#111",
        "color:#fff",
        "font-size:14px",
        "font-weight:500",
        "border-radius:12px 0 0 12px",
      ].join(";"),
      [
        "padding:8px 12px",
        "background: linear-gradient(90deg,#6a11cb,#2575fc)",
        "color:#fff",
        "font-size:14px",
        "font-weight:700",
        "border-radius:0 12px 12px 0",
        "box-shadow:0 2px 6px rgba(0,0,0,.25)",
      ].join(";")
    );
  }

}

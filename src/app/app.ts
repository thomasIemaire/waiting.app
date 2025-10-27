import { Component, inject } from '@angular/core';
import { BrandComponent } from "./components/brand/brand.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { User, UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BrandComponent, SidebarComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  public user: User | null = null;

  private userService: UserService = inject(UserService);

  ngOnInit() {
    this.userService.user.value$.subscribe(user => {
      this.user = user;
    });
  }

}

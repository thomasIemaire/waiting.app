import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith, Subscription } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { UserAvatarDetailsComponent } from "../user-avatar-details/user-avatar-details.component";
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-header',
  imports: [BreadcrumbModule, UserAvatarDetailsComponent, ButtonModule, TooltipModule],
  template: `
  <div class="header__container">
    <div class="header__wrapper">
      <div class="header-left__wrapper">
        <p-breadcrumb [model]="breadcrumb"></p-breadcrumb>
        <div class="header-left__title">{{ title }}</div>
      </div>
      <div class="header-right__wrapper">
        <app-user-avatar-details />
         <p-button variant="text" severity="secondary" size="small" icon="pi pi-sign-out" pTooltip="Se déconnecter" tooltipPosition="left" />
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  title = '';
  breadcrumb: MenuItem[] = [];
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let route = this.router.routerState.root;
        while (route.firstChild) route = route.firstChild;
        const snap = route.snapshot;

        const explicitTitle =
          (snap.data?.['title'] as string | undefined) ?? snap.title ?? '';

        const items = this.buildBreadcrumb(this.router.url);
        const fallbackTitle = items.at(-1)?.label ?? '';

        return {
          title: explicitTitle || fallbackTitle,
          breadcrumb: items
        };
      })
    ).subscribe(({ title, breadcrumb }) => {
      this.title = title;
      this.breadcrumb = breadcrumb;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private buildBreadcrumb(url: string): MenuItem[] {
    const clean = url.split('?')[0].split('#')[0];
    const segments = clean.split('/').filter(Boolean);

    const items: MenuItem[] = [];
    let acc = '';

    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      items.push({
        label: this.prettyLabel(seg),
        routerLink: acc,
        disabled: i === segments.length - 1
      });
    });

    return items;
  }

  private prettyLabel(raw: string): string {
    const s = decodeURIComponent(raw).replace(/[-_]+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ToastModule } from 'primeng/toast';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Desktop: slim (icon-only) sidebar; mobile: off-canvas sidebar open
  protected readonly slim = signal(false);
  protected readonly mobileOpen = signal(false);

  // Sidebar nav: add new features under the appropriate group
  protected readonly navGroups: NavGroup[] = [
    {
      key: 'admin',
      label: '系統管理 Admin',
      icon: 'pi pi-shield',
      items: [{ label: '角色 AppRole', icon: 'pi pi-id-card', route: '/app-roles' }],
    },
  ];

  constructor(router: Router) {
    // Close the mobile menu after navigation
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileOpen.set(false));
  }

  protected toggleSlim(): void {
    this.slim.update((v) => !v);
  }

  protected toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }
}

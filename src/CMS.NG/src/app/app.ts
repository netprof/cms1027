import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  protected readonly collapsed = signal(false);

  // Sidebar nav: add new features under the appropriate group
  protected readonly navGroups: NavGroup[] = [
    {
      key: 'admin',
      label: '系統管理 Admin',
      icon: 'pi pi-shield',
      items: [{ label: '角色 AppRole', icon: 'pi pi-id-card', route: '/app-roles' }],
    },
  ];

  protected readonly openGroups = signal<Set<string>>(new Set(['admin']));

  protected toggleGroup(key: string): void {
    this.openGroups.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SortEvent } from 'primeng/api';
import { apiErrorMessage } from '../../../core/api-error';
import { loadSession, saveSession } from '../../../core/session-store';
import { AppRole, AppRoleQuery } from '../app-role.model';
import { AppRoleService } from '../app-role.service';

export const FILTERS_KEY = 'app-role-list-filters';
export const SORT_KEY = 'app-role-list-sort';
export const PAGE_KEY = 'app-role-list-page';

interface SortState {
  field: string;
  order: number;
}

interface PageState {
  first: number;
  rows: number;
}

const EMPTY_FILTERS: AppRoleQuery = { keyword: null, permissionLevelFrom: null, permissionLevelTo: null };

@Component({
  selector: 'app-app-role-list',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    ConfirmDialogModule,
    DrawerModule,
    InputNumberModule,
    InputTextModule,
    TableModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './app-role-list.html',
  styleUrl: './app-role-list.scss',
})
export class AppRoleList implements OnInit {
  private readonly service = inject(AppRoleService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly roles = signal<AppRole[]>([]);
  protected readonly loading = signal(false);
  protected readonly filterVisible = signal(false);

  protected filters: AppRoleQuery = loadSession(FILTERS_KEY, { ...EMPTY_FILTERS });
  // Draft edited in the drawer; applied on 搜尋
  protected draft: AppRoleQuery = { ...this.filters };
  protected sort: SortState = loadSession(SORT_KEY, { field: 'roleId', order: 1 });
  protected page: PageState = loadSession(PAGE_KEY, { first: 0, rows: 20 });

  ngOnInit(): void {
    this.load();
  }

  protected get hasFilters(): boolean {
    const f = this.filters;
    return !!f.keyword?.trim() || f.permissionLevelFrom != null || f.permissionLevelTo != null;
  }

  protected load(): void {
    this.loading.set(true);
    this.service.query(this.filters).subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: '載入失敗', detail: apiErrorMessage(err) });
      },
    });
  }

  protected openFilters(): void {
    this.draft = { ...this.filters };
    this.filterVisible.set(true);
  }

  protected applyFilters(): void {
    this.filters = { ...this.draft };
    saveSession(FILTERS_KEY, this.filters);
    this.page = { ...this.page, first: 0 };
    saveSession(PAGE_KEY, this.page);
    this.filterVisible.set(false);
    this.load();
  }

  protected clearFilters(): void {
    this.draft = { ...EMPTY_FILTERS };
    this.applyFilters();
  }

  protected onSort(event: SortEvent): void {
    if (!event.field) return;
    this.sort = { field: event.field, order: event.order ?? 1 };
    saveSession(SORT_KEY, this.sort);
  }

  protected onPage(event: TablePageEvent): void {
    this.page = { first: event.first, rows: event.rows };
    saveSession(PAGE_KEY, this.page);
  }

  protected add(): void {
    this.router.navigate(['/app-roles', 'new']);
  }

  protected remove(role: AppRole): void {
    this.confirm.confirm({
      header: '刪除角色',
      message: `確定要刪除角色「${role.roleId}」嗎？${role.userCount > 0 ? `此角色有 ${role.userCount} 位使用者，關聯也會一併刪除。` : ''}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: '刪除', severity: 'danger' },
      rejectButtonProps: { label: '取消', severity: 'secondary', outlined: true },
      accept: () =>
        this.service.delete(role.roleId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: '已刪除', detail: role.roleId });
            this.load();
          },
          error: (err) =>
            this.messages.add({ severity: 'error', summary: '刪除失敗', detail: apiErrorMessage(err) }),
        }),
    });
  }
}

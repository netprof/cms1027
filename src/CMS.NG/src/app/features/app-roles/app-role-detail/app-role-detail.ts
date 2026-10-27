import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { apiErrorMessage } from '../../../core/api-error';
import { AppRole } from '../app-role.model';
import { AppRoleService } from '../app-role.service';

@Component({
  selector: 'app-app-role-detail',
  imports: [RouterLink, ButtonModule],
  templateUrl: './app-role-detail.html',
})
export class AppRoleDetail implements OnInit {
  private readonly service = inject(AppRoleService);
  private readonly messages = inject(MessageService);

  // Route param :id (RoleId)
  readonly id = input.required<string>();

  protected readonly role = signal<AppRole | null>(null);
  protected readonly notFound = signal(false);

  ngOnInit(): void {
    this.service.get(this.id()).subscribe({
      next: (role) => this.role.set(role),
      error: (err) => {
        this.notFound.set(true);
        this.messages.add({ severity: 'error', summary: '載入失敗', detail: apiErrorMessage(err) });
      },
    });
  }
}

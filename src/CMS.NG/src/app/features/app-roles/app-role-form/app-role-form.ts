import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Observable, forkJoin, of } from 'rxjs';
import { apiErrorMessage } from '../../../core/api-error';
import { LookupService } from '../../../core/lookup.service';
import { AppRole, AppRoleRequest } from '../app-role.model';
import { AppRoleService } from '../app-role.service';

interface UserOption {
  userId: string;
  label: string;
}

@Component({
  selector: 'app-app-role-form',
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule, InputTextModule, MultiSelectModule],
  templateUrl: './app-role-form.html',
  styleUrl: './app-role-form.scss',
})
export class AppRoleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly service = inject(AppRoleService);
  private readonly lookups = inject(LookupService);
  private readonly messages = inject(MessageService);

  // Route param :id (RoleId); absent on /new
  readonly id = input<string>();

  protected readonly userOptions = signal<UserOption[]>([]);
  protected readonly saving = signal(false);
  private pkid = 0;

  protected readonly form = this.fb.nonNullable.group({
    roleId: ['', [Validators.required, Validators.maxLength(200)]],
    roleName: ['', [Validators.required, Validators.maxLength(200)]],
    permissionLevel: [100, Validators.required],
    description: ['', Validators.maxLength(400)],
    userIds: [[] as string[]],
  });

  protected get isEdit(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    const role$: Observable<AppRole | null> = id ? this.service.get(id) : of(null);

    if (id) this.form.controls.roleId.disable();

    forkJoin({ users: this.lookups.getAppUsers(), role: role$ }).subscribe({
      next: ({ users, role }) => {
        this.userOptions.set(users.map((u) => ({ userId: u.userId, label: `${u.userName} (${u.userId})` })));
        if (role) {
          this.pkid = role.pkid;
          this.form.patchValue({
            roleId: role.roleId,
            roleName: role.roleName,
            permissionLevel: role.permissionLevel,
            description: role.description ?? '',
            userIds: role.users.map((u) => u.userId),
          });
        }
      },
      error: (err) =>
        this.messages.add({ severity: 'error', summary: '載入失敗', detail: apiErrorMessage(err) }),
    });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: AppRoleRequest = {
      pkid: this.pkid,
      roleId: v.roleId.trim(),
      roleName: v.roleName.trim(),
      permissionLevel: v.permissionLevel,
      description: v.description.trim() || null,
      userIds: v.userIds,
    };

    this.saving.set(true);
    const save$: Observable<unknown> = this.isEdit ? this.service.update(request) : this.service.create(request);
    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: '已儲存', detail: request.roleId });
        this.router.navigate(['/app-roles', request.roleId]);
      },
      error: (err) => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: '儲存失敗', detail: apiErrorMessage(err) });
      },
    });
  }

  protected cancel(): void {
    const id = this.id();
    this.router.navigate(id ? ['/app-roles', id] : ['/app-roles']);
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { LookupService } from '../../../core/lookup.service';
import { AppRole } from '../app-role.model';
import { AppRoleService } from '../app-role.service';
import { AppRoleForm } from './app-role-form';

describe('AppRoleForm', () => {
  const users = [
    { pkid: 1, userId: 'alice', userName: 'Alice' },
    { pkid: 2, userId: 'bob', userName: 'Bob' },
  ];
  const role: AppRole = {
    pkid: 7,
    roleId: 'Admin',
    roleName: 'Administrator',
    permissionLevel: 1,
    description: '系統管理員',
    userCount: 1,
    users: [users[0]],
  };

  let fixture: ComponentFixture<AppRoleForm>;
  let component: AppRoleForm;
  let service: jasmine.SpyObj<AppRoleService>;
  let lookups: jasmine.SpyObj<LookupService>;
  let messages: jasmine.SpyObj<MessageService>;
  let router: Router;

  const c = () => component as any;

  async function setup(id?: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AppRoleForm],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MessageService, useValue: messages },
        { provide: AppRoleService, useValue: service },
        { provide: LookupService, useValue: lookups },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(AppRoleForm);
    component = fixture.componentInstance;
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<AppRoleService>('AppRoleService', ['get', 'create', 'update']);
    lookups = jasmine.createSpyObj<LookupService>('LookupService', ['getAppUsers']);
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    lookups.getAppUsers.and.returnValue(of(users));
    service.get.and.returnValue(of(role));
    service.create.and.returnValue(of(role));
    service.update.and.returnValue(of(void 0));
  });

  describe('add mode', () => {
    beforeEach(() => setup());

    it('shows the add title and defaults', () => {
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('新增角色');
      expect(service.get).not.toHaveBeenCalled();
      expect(c().form.controls.permissionLevel.value).toBe(100);
      expect(c().form.controls.roleId.enabled).toBeTrue();
    });

    it('maps user lookup to "Name (Id)" options', () => {
      expect(c().userOptions()).toEqual([
        { userId: 'alice', label: 'Alice (alice)' },
        { userId: 'bob', label: 'Bob (bob)' },
      ]);
    });

    it('does not save an invalid form and marks fields touched', () => {
      c().save();

      expect(service.create).not.toHaveBeenCalled();
      expect(c().invalid('roleId')).toBeTrue();
      expect(c().invalid('roleName')).toBeTrue();
    });

    it('creates a trimmed request and navigates to the view page', () => {
      c().form.setValue({
        roleId: ' Editor ',
        roleName: ' Content Editor ',
        permissionLevel: 50,
        description: '  ',
        userIds: ['bob'],
      });

      c().save();

      expect(service.create).toHaveBeenCalledOnceWith({
        pkid: 0,
        roleId: 'Editor',
        roleName: 'Content Editor',
        permissionLevel: 50,
        description: null,
        userIds: ['bob'],
      });
      expect(router.navigate).toHaveBeenCalledWith(['/app-roles', 'Editor']);
      expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    });

    it('shows the API message when create fails', () => {
      service.create.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 409, error: { message: "角色代碼 'Admin' 已存在" } })),
      );
      c().form.patchValue({ roleId: 'Admin', roleName: 'x' });

      c().save();

      expect(messages.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ severity: 'error', detail: "角色代碼 'Admin' 已存在" }),
      );
      expect(router.navigate).not.toHaveBeenCalled();
      expect(c().saving()).toBeFalse();
    });

    it('cancel() returns to the list', () => {
      c().cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/app-roles']);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setup('Admin'));

    it('loads the role and lookups, and patches the form', () => {
      expect(service.get).toHaveBeenCalledOnceWith('Admin');
      expect(lookups.getAppUsers).toHaveBeenCalled();
      expect(c().form.getRawValue()).toEqual({
        roleId: 'Admin',
        roleName: 'Administrator',
        permissionLevel: 1,
        description: '系統管理員',
        userIds: ['alice'],
      });
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('編輯角色');
    });

    it('disables the RoleId (primary key) field', () => {
      expect(c().form.controls.roleId.disabled).toBeTrue();
    });

    it('updates with pkid and RoleId and navigates to the view page', () => {
      c().form.patchValue({ roleName: 'Super Admin', userIds: ['alice', 'bob'] });

      c().save();

      expect(service.update).toHaveBeenCalledOnceWith({
        pkid: 7,
        roleId: 'Admin',
        roleName: 'Super Admin',
        permissionLevel: 1,
        description: '系統管理員',
        userIds: ['alice', 'bob'],
      });
      expect(service.create).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/app-roles', 'Admin']);
    });

    it('cancel() returns to the view page', () => {
      c().cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/app-roles', 'Admin']);
    });
  });
});

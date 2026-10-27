import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { AppRole } from '../app-role.model';
import { AppRoleService } from '../app-role.service';
import { AppRoleDetail } from './app-role-detail';

describe('AppRoleDetail', () => {
  const role: AppRole = {
    pkid: 1,
    roleId: 'Admin',
    roleName: 'Administrator',
    permissionLevel: 1,
    description: '系統管理員',
    userCount: 2,
    users: [
      { pkid: 1, userId: 'alice', userName: 'Alice' },
      { pkid: 2, userId: 'bob', userName: 'Bob' },
    ],
  };

  let fixture: ComponentFixture<AppRoleDetail>;
  let service: jasmine.SpyObj<AppRoleService>;

  async function setup(id: string): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [AppRoleDetail],
      providers: [provideRouter([]), MessageService, { provide: AppRoleService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppRoleDetail);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<AppRoleService>('AppRoleService', ['get']);
  });

  it('loads the role by id and shows its fields and users', async () => {
    service.get.and.returnValue(of(role));

    const el = await setup('Admin');

    expect(service.get).toHaveBeenCalledOnceWith('Admin');
    const text = el.textContent!;
    expect(text).toContain('Administrator');
    expect(text).toContain('系統管理員');
    expect(text).toContain('使用者（2）');
    expect(el.querySelectorAll('.user-list li').length).toBe(2);
    expect(el.querySelector('.user-list li')!.textContent).toContain('Alice (alice)');
  });

  it('links Edit to the edit page', async () => {
    service.get.and.returnValue(of(role));

    const el = await setup('Admin');

    expect(el.querySelector('[href="/app-roles/Admin/edit"]')).not.toBeNull();
  });

  it('shows a placeholder when there are no users', async () => {
    service.get.and.returnValue(of({ ...role, users: [], description: null }));

    const el = await setup('Admin');

    expect(el.textContent).toContain('尚無使用者');
    expect(el.textContent).toContain('—');
  });

  it('shows not-found and an error toast when loading fails', async () => {
    service.get.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));
    const messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    TestBed.overrideProvider(MessageService, { useValue: messages });

    const el = await setup('missing');

    expect(el.textContent).toContain('找不到此角色');
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
  });
});

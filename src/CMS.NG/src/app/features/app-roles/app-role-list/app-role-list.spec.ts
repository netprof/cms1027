import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { AppRole } from '../app-role.model';
import { AppRoleService } from '../app-role.service';
import { AppRoleList, FILTERS_KEY, PAGE_KEY, SORT_KEY } from './app-role-list';

describe('AppRoleList', () => {
  const roles: AppRole[] = [
    { pkid: 1, roleId: 'Admin', roleName: 'Administrator', permissionLevel: 1, description: '系統管理員', userCount: 3, users: [] },
    { pkid: 2, roleId: 'User', roleName: 'User', permissionLevel: 100, description: '一般使用者', userCount: 9, users: [] },
  ];

  let fixture: ComponentFixture<AppRoleList>;
  let component: AppRoleList;
  let service: jasmine.SpyObj<AppRoleService>;
  let messages: MessageService;

  // Access protected members in tests
  const c = () => component as any;
  const el = () => fixture.nativeElement as HTMLElement;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AppRoleList],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: AppRoleService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppRoleList);
    component = fixture.componentInstance;
    messages = TestBed.inject(MessageService);
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionStorage.clear();
    service = jasmine.createSpyObj<AppRoleService>('AppRoleService', ['query', 'delete']);
    service.query.and.returnValue(of(roles));
    service.delete.and.returnValue(of(void 0));
  });

  afterEach(() => sessionStorage.clear());

  it('loads roles with empty filters and renders rows', async () => {
    await setup();

    expect(service.query).toHaveBeenCalledOnceWith({ keyword: null, permissionLevelFrom: null, permissionLevelTo: null });
    const rows = el().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Admin');
    expect(rows[1].textContent).toContain('一般使用者');
  });

  it('renders the page report in Chinese', async () => {
    await setup();

    expect(el().textContent).toContain('1–2 筆，共 2 筆');
  });

  it('restores filters, sort and page from session storage', async () => {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ keyword: 'adm' }));
    sessionStorage.setItem(SORT_KEY, JSON.stringify({ field: 'permissionLevel', order: -1 }));
    sessionStorage.setItem(PAGE_KEY, JSON.stringify({ first: 0, rows: 50 }));

    await setup();

    expect(service.query).toHaveBeenCalledWith(jasmine.objectContaining({ keyword: 'adm' }));
    expect(c().sort).toEqual({ field: 'permissionLevel', order: -1 });
    expect(c().page.rows).toBe(50);
  });

  it('applyFilters() saves filters, resets page and reloads', async () => {
    await setup();
    c().page = { first: 20, rows: 20 };
    c().draft = { keyword: 'user', permissionLevelFrom: 50, permissionLevelTo: null };

    c().applyFilters();

    expect(service.query).toHaveBeenCalledTimes(2);
    expect(service.query.calls.mostRecent().args[0]).toEqual({ keyword: 'user', permissionLevelFrom: 50, permissionLevelTo: null });
    expect(JSON.parse(sessionStorage.getItem(FILTERS_KEY)!).keyword).toBe('user');
    expect(JSON.parse(sessionStorage.getItem(PAGE_KEY)!).first).toBe(0);
    expect(c().filterVisible()).toBeFalse();
    expect(c().hasFilters).toBeTrue();
  });

  it('clearFilters() resets to empty filters', async () => {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ keyword: 'adm' }));
    await setup();

    c().clearFilters();

    expect(service.query.calls.mostRecent().args[0]).toEqual({ keyword: null, permissionLevelFrom: null, permissionLevelTo: null });
    expect(c().hasFilters).toBeFalse();
  });

  it('saves sort and page changes to session storage', async () => {
    await setup();

    c().onSort({ field: 'roleName', order: -1 });
    c().onPage({ first: 10, rows: 10 });

    expect(JSON.parse(sessionStorage.getItem(SORT_KEY)!)).toEqual({ field: 'roleName', order: -1 });
    expect(JSON.parse(sessionStorage.getItem(PAGE_KEY)!)).toEqual({ first: 10, rows: 10 });
  });

  it('add() navigates to the new page', async () => {
    await setup();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    c().add();

    expect(router.navigate).toHaveBeenCalledWith(['/app-roles', 'new']);
  });

  it('has view and edit links for each row', async () => {
    await setup();

    const links = Array.from(el().querySelectorAll('tbody tr:first-child [href]')).map((a) => a.getAttribute('href'));
    expect(links).toContain('/app-roles/Admin');
    expect(links).toContain('/app-roles/Admin/edit');
  });

  it('remove() deletes after confirmation and reloads', async () => {
    await setup();
    const confirm = fixture.debugElement.injector.get(ConfirmationService);
    spyOn(confirm, 'confirm').and.callFake((opts) => {
      opts.accept!();
      return confirm;
    });

    c().remove(roles[1]);

    expect(service.delete).toHaveBeenCalledOnceWith('User');
    expect(service.query).toHaveBeenCalledTimes(2);
  });

  it('shows an error toast when loading fails', async () => {
    service.query.and.returnValue(throwError(() => new Error('boom')));
    await TestBed.configureTestingModule({
      imports: [AppRoleList],
      providers: [provideRouter([]), provideNoopAnimations(), MessageService, { provide: AppRoleService, useValue: service }],
    }).compileComponents();
    messages = TestBed.inject(MessageService);
    spyOn(messages, 'add');

    fixture = TestBed.createComponent(AppRoleList);
    fixture.detectChanges();

    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
    expect((fixture.componentInstance as any).loading()).toBeFalse();
  });
});

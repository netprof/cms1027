import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { AppRole, AppRoleRequest } from './app-role.model';
import { AppRoleService } from './app-role.service';

describe('AppRoleService', () => {
  const base = `${environment.apiUrl}/appRoles`;
  let service: AppRoleService;
  let http: HttpTestingController;

  const role: AppRole = {
    pkid: 1,
    roleId: 'Admin',
    roleName: 'Administrator',
    permissionLevel: 1,
    description: '系統管理員',
    userCount: 0,
    users: [],
  };

  const request: AppRoleRequest = {
    pkid: 1,
    roleId: 'Admin',
    roleName: 'Administrator',
    permissionLevel: 1,
    description: null,
    userIds: ['alice'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppRoleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() GETs the collection', () => {
    service.getAll().subscribe((res) => expect(res).toEqual([role]));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([role]);
  });

  it('query() POSTs the filter to /query', () => {
    const filter = { keyword: 'adm', permissionLevelFrom: 1, permissionLevelTo: null };
    service.query(filter).subscribe((res) => expect(res.length).toBe(1));

    const req = http.expectOne(`${base}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filter);
    req.flush([role]);
  });

  it('get() encodes the string id', () => {
    service.get('Sales/East').subscribe();

    const req = http.expectOne(`${base}/Sales%2FEast`);
    expect(req.request.method).toBe('GET');
    req.flush(role);
  });

  it('create() POSTs the request', () => {
    service.create(request).subscribe((res) => expect(res).toEqual(role));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(role);
  });

  it('update() PUTs with the key in the body (no route id)', () => {
    service.update(request).subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.roleId).toBe('Admin');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('delete() DELETEs the encoded id', () => {
    service.delete('a b').subscribe();

    const req = http.expectOne(`${base}/a%20b`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});

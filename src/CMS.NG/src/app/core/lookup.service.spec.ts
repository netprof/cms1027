import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { LookupService } from './lookup.service';

describe('LookupService', () => {
  it('getAppUsers() GETs /lookups/appUsers', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(LookupService);
    const http = TestBed.inject(HttpTestingController);
    const users = [{ pkid: 1, userId: 'alice', userName: 'Alice' }];

    service.getAppUsers().subscribe((res) => expect(res).toEqual(users));

    http.expectOne(`${environment.apiUrl}/lookups/appUsers`).flush(users);
    http.verify();
  });
});

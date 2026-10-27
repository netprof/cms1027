import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideNoopAnimations(), MessageService],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the Admin > AppRole sidebar entry', () => {
    const el = render();

    expect(el.querySelector('.menu-section-title')?.textContent).toContain('系統管理 Admin');
    const link = el.querySelector<HTMLAnchorElement>('a.menu-item');
    expect(link?.textContent).toContain('角色 AppRole');
    expect(link?.getAttribute('href')).toBe('/app-roles');
  });

  it('should toggle slim mode', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('.slim-toggle')!;

    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('.layout')!.classList).toContain('slim');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('.layout')!.classList).not.toContain('slim');
  });

  it('should open the mobile menu and close it from the mask', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    el.querySelector<HTMLButtonElement>('.menu-button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.layout')!.classList).toContain('mobile-open');

    el.querySelector<HTMLElement>('.mask')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.layout')!.classList).not.toContain('mobile-open');
  });
});

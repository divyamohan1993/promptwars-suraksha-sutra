import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';
import { ShellHomeComponent } from './shell/shell-home.component';

describe('App shell', () => {
  it('exposes keyboard navigation and semantic application landmarks', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(appRoutes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('header[aria-labelledby="application-title"]')).not.toBeNull();
    expect(element.querySelector('main#main-content[tabindex="-1"]')).not.toBeNull();
    expect(element.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(element.querySelector('[role="alert"][aria-live="assertive"]')).not.toBeNull();
  });

  it('renders an accessible product-neutral landing message', async () => {
    await TestBed.configureTestingModule({
      imports: [ShellHomeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellHomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('safer next step');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('ready');
  });
});

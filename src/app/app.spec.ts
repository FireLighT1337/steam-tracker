import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { App } from './app';
import { SteamStateService } from './core/services/steam-state.service';

const mockSteamState = {
  initialize: vi.fn(),
  isLoggedInSignal: signal(false),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: SteamStateService, useValue: mockSteamState }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1, .navbar-brand')?.textContent).toContain('SteamTracker');
  });
});

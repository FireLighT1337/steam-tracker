import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SteamStateService } from '../../core/services/steam-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly steamState = inject(SteamStateService);

  isLoggedIn = this.steamState.isLoggedInSignal;

  isGameDetailsPage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/game/')),
      startWith(this.router.url.startsWith('/game/')),
    ),
    { initialValue: false },
  );

  goBack(): void {
    this.location.back();
  }

  login(): void {
    window.location.href = `${environment.authBaseUrl}/auth/steam`;
  }

  logout(): void {
    this.steamState.logout();
  }
}

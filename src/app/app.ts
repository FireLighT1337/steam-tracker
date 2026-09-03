import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { SteamStateService } from './core/services/steam-state.service';
import { Footer } from './shared/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly steamState = inject(SteamStateService);

  protected readonly title = signal('steam-tracker');

  constructor() {
    this.steamState.initialize();
  }
}

import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  imports: [NgClass],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  icon = input.required<string>();
  title = input.required<string>();
  value = input.required<string | number>();
}

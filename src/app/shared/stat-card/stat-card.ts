import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export interface StatTooltipItem {
  name: string;
  hours: number;
}

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
  tooltipItems = input<StatTooltipItem[] | null>(null);
}

import { Injectable } from '@angular/core';

import { DashboardData } from '../../models/dashboard-data.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  private readonly dashboardData: DashboardData = {
    profile: {
      steamId: '76561198000000000',
      username: 'FireLighT',
      avatar: 'https://placehold.co/96x96',
      steamLevel: 50,
      profileUrl: 'https://steamcommunity.com/',
      country: 'DE',
    },

    games: [
      {
        appId: 1245620,
        name: 'Elden Ring',
        headerImage: 'https://placehold.co/600x338',
        playtimeMinutes: 8880,
        achievementPercentage: 84,
        isCompleted: false,
        isBacklog: false,
        lastPlayed: new Date('2026-08-28'),

        achievements: [
          {
            name: 'Elden Lord',
            description: 'Achieved the "Elden Lord" ending.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 9.8,
          },
          {
            name: 'Shardbearer Malenia',
            description: 'Defeated Shardbearer Malenia.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 20.4,
          },
          {
            name: 'Legendary Armaments',
            description: 'Acquired all legendary armaments.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: false,
            unlockPercentage: 5.2,
          },
        ],
      },
      {
        appId: 1086940,
        name: "Baldur's Gate 3",
        headerImage: 'https://placehold.co/600x338',
        playtimeMinutes: 5760,
        achievementPercentage: 67,
        isCompleted: false,
        isBacklog: true,
        lastPlayed: new Date('2026-08-24'),

        achievements: [
          {
            name: 'Elden Lord',
            description: 'Achieved the "Elden Lord" ending.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 9.8,
          },
          {
            name: 'Shardbearer Malenia',
            description: 'Defeated Shardbearer Malenia.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 20.4,
          },
          {
            name: 'Legendary Armaments',
            description: 'Acquired all legendary armaments.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: false,
            unlockPercentage: 5.2,
          },
        ],
      },
      {
        appId: 1091500,
        name: 'Cyberpunk 2077',
        headerImage: 'https://placehold.co/600x338',
        playtimeMinutes: 4320,
        achievementPercentage: 91,
        isCompleted: true,
        isBacklog: false,
        lastPlayed: new Date('2026-08-20'),

        achievements: [
          {
            name: 'Elden Lord',
            description: 'Achieved the "Elden Lord" ending.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 9.8,
          },
          {
            name: 'Shardbearer Malenia',
            description: 'Defeated Shardbearer Malenia.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 20.4,
          },
          {
            name: 'Legendary Armaments',
            description: 'Acquired all legendary armaments.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: false,
            unlockPercentage: 5.2,
          },
        ],
      },
      {
        appId: 1174180,
        name: 'Red Dead Redemption 2',
        headerImage: 'https://placehold.co/600x338',
        playtimeMinutes: 7200,
        achievementPercentage: 58,
        isCompleted: false,
        isBacklog: true,
        lastPlayed: new Date('2026-08-15'),

        achievements: [
          {
            name: 'Elden Lord',
            description: 'Achieved the "Elden Lord" ending.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 9.8,
          },
          {
            name: 'Shardbearer Malenia',
            description: 'Defeated Shardbearer Malenia.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: true,
            unlockPercentage: 20.4,
          },
          {
            name: 'Legendary Armaments',
            description: 'Acquired all legendary armaments.',
            icon: 'https://placehold.co/64x64',
            isUnlocked: false,
            unlockPercentage: 5.2,
          },
        ],
      },
    ],
  };

  getDashboardData(): DashboardData {
    return this.dashboardData;
  }
}

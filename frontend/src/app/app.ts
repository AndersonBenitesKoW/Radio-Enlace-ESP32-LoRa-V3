import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-dark-500 bg-dark-800/90 backdrop-blur">
      <div class="max-w-[1600px] mx-auto px-6 flex items-center gap-1">
        <a routerLink="/"
           routerLinkActive="border-emerald-500 text-white"
           [routerLinkActiveOptions]="{exact: true}"
           class="px-5 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 hover:border-gray-600 transition-colors">
          <span class="mr-2">&#x1F4E1;</span>Monitoreo
        </a>
        <a routerLink="/chat"
           routerLinkActive="border-emerald-500 text-white"
           class="px-5 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-200 hover:border-gray-600 transition-colors">
          <span class="mr-2">&#x1F4AC;</span>Chat LoRa
        </a>
      </div>
    </nav>

    <div class="pt-[49px]">
      <router-outlet />
    </div>
  `,
})
export class App {}

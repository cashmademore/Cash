import {ChangeDetectionStrategy, Component} from '@angular/core';
import { AiAvatarComponent } from './ai-avatar.component';
import { ChatPanelComponent } from './chat-panel.component';
import { TaskPanelComponent } from './task-panel.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [AiAvatarComponent, ChatPanelComponent, TaskPanelComponent, MatIconModule],
  template: `
    <div class="h-screen w-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <!-- Top header (IDE Toolbar) -->
      <header class="h-12 bg-white border-b border-gray-200 shadow-sm flex items-center px-4 justify-between shrink-0 z-10">
        <div class="flex items-center space-x-4">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span class="ml-4 font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hidden sm:block">~/project/ia-ide-workspace</span>
        </div>
        <div class="flex items-center space-x-2 text-sm font-medium text-gray-600">
          <mat-icon class="text-indigo-600 mr-1">bolt</mat-icon>
          CoPilot Core Online
        </div>
      </header>

      <!-- Main IDE split view -->
      <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        <!-- Left Sidebar: Subagent Tasks -->
        <aside class="w-full lg:w-80 shrink-0 border-r border-gray-200 z-10 overflow-hidden">
          <app-task-panel></app-task-panel>
        </aside>

        <!-- Center: Simulated Editor / Chat Area -->
        <main class="flex-1 relative flex flex-col p-4 sm:p-6 lg:p-8 bg-gray-100 overflow-y-auto">
          <div class="max-w-4xl w-full mx-auto h-full flex flex-col">
            
            <div class="mb-6 flex-1 min-h-[300px] max-h-[400px]">
                <!-- 3D WebGL Avatar Placeholder -->
                <app-ai-avatar></app-ai-avatar>
            </div>

            <div class="flex-1 shrink-0 h-96">
                <!-- Chat / Prompt area -->
                <app-chat-panel></app-chat-panel>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class App {}


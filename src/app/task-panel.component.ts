import { Component, inject } from '@angular/core';
import { AgentPlannerService } from './agent-planner.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-task-panel',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div class="p-4 border-b border-gray-200 bg-white">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
            <mat-icon class="text-[16px] w-[16px] h-[16px] mr-2 text-indigo-500">schema</mat-icon>
            Subagent Tasks
        </h2>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        @if (planner.isProcessing()) {
          <div class="flex items-center justify-center p-8 space-x-3 text-gray-400">
            <mat-icon class="animate-spin text-indigo-400">sync</mat-icon>
            <span class="text-sm font-medium">Orchestrating subagents...</span>
          </div>
        } @else if (planner.currentTodos().length > 0) {
          @for (task of planner.currentTodos(); track task.id) {
            <div class="group relative flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:border-indigo-200 hover:shadow-md cursor-pointer"
                 (click)="simulateTaskProgress(task.id)">
              <div class="mt-0.5">
                 @if (task.status === 'completed') {
                    <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">check</mat-icon>
                    </div>
                 } @else if (task.status === 'in_progress') {
                    <div class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] animate-spin">refresh</mat-icon>
                    </div>
                 } @else {
                    <div class="w-5 h-5 rounded-full bg-gray-100 border border-gray-300"></div>
                 }
              </div>
              <div class="flex-1 min-w-0">
                 <p class="text-sm font-medium text-gray-900 leading-tight" 
                    [class.line-through]="task.status === 'completed'"
                    [class.text-gray-400]="task.status === 'completed'">
                   {{task.subagent_task}}
                 </p>
                 <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">
                    {{task.status}}
                 </p>
              </div>
            </div>
          }
        } @else {
          <div class="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-100/50 rounded-xl border border-dashed border-gray-300">
             <mat-icon class="text-4xl text-gray-400 mb-4">account_tree</mat-icon>
             <p class="text-sm text-gray-500 font-medium">No active tasks.</p>
             <p class="text-xs text-gray-400 mt-1">Prompt the AI to start a multi-step workflow.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class TaskPanelComponent {
  planner = inject(AgentPlannerService);

  simulateTaskProgress(taskId: string) {
      const task = this.planner.currentTodos().find(t => t.id === taskId);
      if (!task) return;

      if (task.status === 'pending') {
          this.planner.updateTodoStatus(taskId, 'in_progress');
          setTimeout(() => {
              this.planner.updateTodoStatus(taskId, 'completed');
          }, 2000);
      } else if (task.status === 'in_progress') {
          this.planner.updateTodoStatus(taskId, 'completed');
      } else {
          this.planner.updateTodoStatus(taskId, 'pending');
      }
  }
}

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AgentPlannerService } from './agent-planner.service';
import { VoiceService } from './voice.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="flex-1 p-6 flex flex-col justify-end space-y-4 overflow-y-auto">
        <!-- Render current summary if available -->
        @if (planner.currentSummary()) {
          <div class="flex items-start gap-4">
             <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <mat-icon class="text-white text-[18px] w-[18px] h-[18px]">smart_toy</mat-icon>
             </div>
             <div class="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-lg shadow-sm border border-gray-200">
                <p class="text-sm font-medium leading-relaxed">{{ planner.currentSummary() }}</p>
             </div>
          </div>
        }
        @if (planner.isProcessing()) {
          <div class="flex items-center gap-2 text-gray-400 p-4">
            <span class="flex space-x-1">
                <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
            </span>
          </div>
        }
      </div>

      <div class="p-4 bg-gray-50 border-t border-gray-200">
        <form (ngSubmit)="onSubmit()" class="relative flex items-center">
            <button 
              type="button"
              (click)="toggleListening()"
              [disabled]="planner.isProcessing()"
              class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all flex items-center justify-center disabled:opacity-50"
              [class.text-indigo-600]="isListening()"
              [class.bg-indigo-100]="isListening()"
              [class.text-gray-400]="!isListening()"
              [class.hover:bg-gray-200]="!isListening()"
              [class.hover:text-gray-600]="!isListening()"
              title="Toggle voice input"
            >
                @if (isListening()) {
                    <span class="absolute w-full h-full rounded-full border border-indigo-400 animate-ping opacity-75"></span>
                }
                <mat-icon class="text-[20px] w-[20px] h-[20px] z-10">{{ isListening() ? 'mic' : 'mic_none' }}</mat-icon>
            </button>
            
            <input 
              type="text" 
              [formControl]="promptControl"
              placeholder="Ask Copilot... (e.g. 'Refactor auth module')"
              class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block pl-12 pr-12 py-3 shadow-sm placeholder-gray-400 transition-all font-sans"
              [class.opacity-50]="planner.isProcessing() || isListening()"
            >
            
            <button 
              type="submit" 
              [disabled]="planner.isProcessing() || (!promptControl.value?.trim() && !isListening())"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                <mat-icon class="text-[20px] w-[20px] h-[20px]">arrow_upward</mat-icon>
            </button>
        </form>
        <p class="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1 font-medium font-sans">
            <mat-icon class="text-[12px] w-[12px] h-[12px]">keyboard_command_key</mat-icon>
            + Space to activate voice layout
        </p>
      </div>
    </div>
  `,
})
export class ChatPanelComponent implements OnInit, OnDestroy {
  promptControl = new FormControl('');
  planner = inject(AgentPlannerService);
  voiceService = inject(VoiceService);

  isListening = signal<boolean>(false);
  private recognition: any;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
          this.isListening.set(true);
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const combined = finalTranscript || interimTranscript;
          if (combined && this.isListening()) {
            this.promptControl.setValue(combined, { emitEvent: false });
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          this.isListening.set(false);
        };

        this.recognition.onend = () => {
          // If we finished capturing voice, you can optionally auto-submit here
          // For now, we just turn off the mic and let the user press submit
          this.isListening.set(false);
        };
      }
    }
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  toggleListening() {
    if (!this.recognition) {
      alert("Speech recognition isn't supported in this browser.");
      return;
    }
    
    if (this.isListening()) {
      this.recognition.stop();
    } else {
      this.promptControl.setValue('');
      this.recognition.start();
    }
  }

  async onSubmit() {
    const prompt = this.promptControl.value;
    if (!prompt || !prompt.trim() || this.planner.isProcessing()) return;

    if (this.isListening() && this.recognition) {
        this.recognition.stop();
    }

    this.promptControl.setValue('');
    const response = await this.planner.planTask(prompt);
    
    if (response && response.spoken_summary) {
        this.voiceService.speak(response.spoken_summary);
    }
  }
}

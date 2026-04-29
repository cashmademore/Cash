import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface TaskTodo {
  id: string;
  subagent_task: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PlannerResponse {
  todos: TaskTodo[];
  spoken_summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentPlannerService {
  private ai: GoogleGenAI;
  
  public isProcessing = signal<boolean>(false);
  public currentTodos = signal<TaskTodo[]>([]);
  public currentSummary = signal<string>('');

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async planTask(prompt: string): Promise<PlannerResponse | null> {
    this.isProcessing.set(true);
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are an AI IDE assistant like Microsoft Copilot or OpenClaw. The user will ask you to perform a programming task.
Your job is to break down the user's request into a set of 'subagent_task' steps (todos), and also provide a 'spoken_summary' string.
The 'spoken_summary' will be read by a highly expressive Neural TTS. Write it EXACTLY as a human would speak it.
Do not use markdown, bullet points, or code syntax. Use conversational fillers naturally (e.g., 'Alright, I've got that refactored', 'Hmm, I noticed an issue...').

You must reply ONLY with a valid JSON object matching this schema:
{
  "todos": [
    { "id": "task_1", "subagent_task": "step description here", "status": "pending" }
  ],
  "spoken_summary": "Conversational text here"
}

Ensure the response is valid JSON.`,
        }
      });
      
      const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const parsed = JSON.parse(text) as PlannerResponse;
      
      this.currentTodos.set(parsed.todos || []);
      this.currentSummary.set(parsed.spoken_summary || '');
      
      return parsed;

    } catch (error) {
      console.error("Failed to plan task:", error);
      return null;
    } finally {
      this.isProcessing.set(false);
    }
  }

  updateTodoStatus(id: string, status: 'pending' | 'in_progress' | 'completed') {
    this.currentTodos.update(todos => 
      todos.map(t => t.id === id ? { ...t, status } : t)
    );
  }
}

import { Component, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-radio-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radio-chat.html',
  styleUrl: './radio-chat.css',
})
export class RadioChat implements AfterViewChecked {
  inputText = '';

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(public chat: ChatService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;

    this.chat.sendMessage(text);
    this.inputText = '';
  }

  onKeyEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch {
      /* ignore */
    }
  }
}

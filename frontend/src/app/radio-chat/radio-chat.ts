import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../services/websocket.service';

interface ChatMessage {
  text: string;
  direction: 'sent' | 'received';
  timestamp: Date;
  rssi?: number;
  snr?: number;
}

@Component({
  selector: 'app-radio-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radio-chat.html',
  styleUrl: './radio-chat.css',
})
export class RadioChat implements OnInit, OnDestroy, AfterViewChecked {
  messages: ChatMessage[] = [];
  inputText = '';
  linkStatus = 'Esperando conexion...';
  private sub!: Subscription;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(private ws: WebSocketService) {}

  ngOnInit(): void {
    this.sub = this.ws.messages$.subscribe((msg) => {
      if (msg.type === 'chat') {
        this.messages.push({
          text: msg.data.message,
          direction: 'received',
          timestamp: new Date(),
          rssi: msg.data.rssi,
          snr: msg.data.snr,
        });
        this.linkStatus = `RSSI: ${msg.data.rssi} dBm | SNR: ${msg.data.snr} dB`;
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;

    this.messages.push({
      text,
      direction: 'sent',
      timestamp: new Date(),
    });

    this.ws.send({ type: 'send_chat', message: text });
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

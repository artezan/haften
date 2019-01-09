import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketIoService {
  private socket: SocketIOClient.Socket; // The client instance of socket.io
  constructor() {
    // start listen
    this.socket = io('http://localhost:3000/');
  }
  /**
   * evento llamado en los post notification
   */
  public onNewProduct(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('NEW_PRODUCT', newPost => observer.next(newPost));
    });
  }
}

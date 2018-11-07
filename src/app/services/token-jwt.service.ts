import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { URL_SERVER } from '../_config/url.api';

@Injectable({
  providedIn: 'root'
})
export class TokenJwtService {
  constructor(private http: HttpClient) {}
  getTokenJWT(username: string, password: string): Observable<any> {
    const body = {
      username,
      password
    };
    return this.http.post(URL_SERVER + '/jwt-auth/v1/token', body);
  }
}

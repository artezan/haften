import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVER, KEYS_WOO } from '../_config/url.api';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}
  postProducts(data: any[], token): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.post(
      URL_SERVER + '/wc/v2/products/batch/?' + KEYS_WOO,
      { create: data },
      {
        headers: headers,
      },
    );
  }
}

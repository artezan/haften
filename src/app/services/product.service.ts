import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVER, KEYS_WOO } from '../_config/url.api';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}
  public postProducts(data: any[], token): Observable<any> {
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
  public postCategory(name: string, parent?: string): Observable<any> {
    let body: { name: string; parent?: string };
    if (parent) {
      body = {
        name,
        parent,
      };
    } else {
      body = {
        name,
      };
    }
    console.log(body);
    return this.http.post(
      URL_SERVER + '/wc/v2/products/categories?' + KEYS_WOO,
      body,
    );
  }
  public postCategories(data: any[], token?): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    console.log('dataPost', data);
    return this.http
      .post(
        URL_SERVER + '/wc/v2/products/categories/batch?' + KEYS_WOO,
        {
          create: data,
        },
        {
          headers: headers,
        },
      )
      .pipe(map((res: any) => res.create));
  }
  public getCategories(token): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.get(
      URL_SERVER + '/wc/v2/products/categories?' + KEYS_WOO,
      {
        headers: headers,
      },
    );
  }
  public getAttributes(token): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.get(
      URL_SERVER + '/wc/v2/products/attributes?' + KEYS_WOO,
      {
        headers: headers,
      },
    );
  }
  public postAttributes(data: any[], token?): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    console.log('postAttributes', data);
    return this.http
      .post(
        URL_SERVER + '/wc/v2/products/attributes/batch?' + KEYS_WOO,
        {
          create: data,
        },
        {
          headers: headers,
        },
      )
      .pipe(map((res: any) => res.create));
  }
  public getTerms(attributeId: string, token?): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.get(
      `${URL_SERVER}/wc/v2/products/attributes/${attributeId}/terms?${KEYS_WOO}`,
      {
        headers: headers,
      },
    );
  }
  public postTerms(attributeId: string, data: any[], token?): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    console.log('postTerms', data);
    return this.http
      .post(
        `${URL_SERVER}/wc/v2/products/attributes/${attributeId}/terms/batch?${KEYS_WOO}`,
        {
          create: data,
        },
        {
          headers: headers,
        },
      )
      .pipe(map((res: any) => res.create));
  }
  public postProductVariation(
    productId: string,
    data: any[],
    token?,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    console.log('variations', data);
    return this.http
      .post(
        `${URL_SERVER}/wc/v2/products/${productId}/variations/batch?${KEYS_WOO}`,
        {
          create: data,
        },
        {
          headers: headers,
        },
      )
      .pipe(map((res: any) => res.create));
  }
  public getMedias(token): Observable<any[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.get<any[]>(URL_SERVER + '/wp/v2/media', {
      headers: headers,
    });
  }
  public getTags(token): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    return this.http.get(URL_SERVER + '/wc/v2/products/tags?' + KEYS_WOO, {
      headers: headers,
    });
  }
  public postProductTags(data: any[], token?): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;',
    });
    console.log('tags new', data);
    return this.http
      .post(
        `${URL_SERVER}/wc/v2/products/tags/batch?${KEYS_WOO}`,
        {
          create: data,
        },
        {
          headers: headers,
        },
      )
      .pipe(map((res: any) => res.create));
  }
}

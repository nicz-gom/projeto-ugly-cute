import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Formato cru da API (price chega como texto por causa do Decimal). */
interface ProductResponse {
  id: number;
  name: string;
  price: string;
  image: string;
  description: string | null;
  categoryId: number;
  active: boolean;
}

/** Produto como a tela de admin usa: igual à API, mas com price numérico. */
export interface AdminProduct extends Omit<ProductResponse, 'price'> {
  price: number;
}
//Omit<ProductResponse, 'price'> pega todos os campos de ProductResponse menos o price. O extends adiciona o price de volta, agora como number. Assim você não repete os outros 6 campos.
//{ ...p, price: Number(p.price) } copia o objeto inteiro com o spread (...) e sobrescreve só o price

/** O que o formulário envia para cadastrar ou editar. */
export interface ProductInput {
  name: string;
  price: number;
  image: string;
  categoryId: number;
  description?: string;
  active?: boolean; // opcional: se não vier, o banco usa @default(true)
}

const toAdminProduct = (p: ProductResponse): AdminProduct => ({ ...p, price: Number(p.price) });

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/products';

  getProducts(): Observable<AdminProduct[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl).pipe(map((items) => items.map(toAdminProduct)));
  }

  postProduct(data: ProductInput): Observable<AdminProduct> {
    return this.http.post<ProductResponse>(this.apiUrl, data).pipe(map(toAdminProduct));
  }

  putProduct(id: number, data: Partial<ProductInput>): Observable<AdminProduct> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, data).pipe(map(toAdminProduct));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

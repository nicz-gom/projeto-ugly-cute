import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Categoria como a API devolve em /api/categories. */
export interface CategoryResponse {
  id: number;
  name: string;
}

/** O que o formulário envia para cadastrar uma categoria. */
export interface CategoryInput {
  name: string;
}

/*
Diferente do ProductsService, aqui não há conversão (map): a categoria só tem id e name,
sem Decimal, então o JSON da API já chega no formato que a tela usa.
*/
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/categories';

  /** GET público: lista as categorias em ordem alfabética (para o <select> do painel). */
  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiUrl);
  }

  /**
   * POST protegido: exige o token (interceptor).
   * Respostas de erro: 400 se o nome vier vazio, 409 se a categoria já existir.
   */
  postCategory(data: CategoryInput): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.apiUrl, data);
  }
}

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).getToken();

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/**HttpInterceptorFn: uma função que recebe toda requisição (req) antes de ela sair e decide o que fazer com ela.
next(req) deixa a requisição seguir viagem.
req.clone(...): requisições são imutáveis, então não dá para alterar a original. Você cria uma cópia com o cabeçalho a mais.
Sem token (usuário não logado), a requisição segue como está.
*/
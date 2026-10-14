
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:4200' })); //responde ao navegador que o site localhost:4200 pode chamar esta API. Sem isso, o navegador bloqueia a resposta, porque o Angular e a API rodam em portas diferentes
app.use(express.json()); //lê o corpo da requisição e transforma o JSON em objeto, em req.body. Sem ele, req.body chega undefined. Tem que vir antes das rotas, senão não funciona

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

//1. app.use('/api/auth', authRoutes) monta o roteador em um prefixo. A rota /login do arquivo vira /api/auth/login.
//'2. app.listen(port) sobe o servidor e fica esperando requisições.

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));
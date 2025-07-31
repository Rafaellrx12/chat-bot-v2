import Fastify from 'fastify';
import cors from '@fastify/cors';
import { productRoutes } from './routes/products';

const app = Fastify({ logger: true });

app.register(cors, {
  origin: ['http://127.0.0.1:5500','http://localhost:3000',],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  
});

app.register(productRoutes);

app.listen({ port: 3001 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log('🚀 API rodando em http://localhost:3001');
});

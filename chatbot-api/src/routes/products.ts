import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { productSchema } from '../validators/productValidator';

const prisma = new PrismaClient();

export async function productRoutes(fastify: FastifyInstance) {
  fastify.get('/products', async () => {
    return prisma.product.findMany();
  });

  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.findUnique({ where: { id: id } });
    if (!product) return reply.code(404).send({ message: 'Produto não encontrado' });
    return product;
  });

  fastify.post('/products', async (request, reply) => {
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(parsed.error.flatten());
    }

    const newProduct = await prisma.product.create({ data: parsed.data });
    return reply.code(201).send(newProduct);
  });

  fastify.put('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(parsed.error.flatten());
    }

    try {
      const updated = await prisma.product.update({
        where: { id: id },
        data: parsed.data,
      });
      return updated;
    } catch (error) {
      return reply.code(404).send({ message: 'Produto não encontrado' });
    }
  });

  fastify.delete('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.product.delete({ where: { id: id } });
      return { message: 'Produto excluído' };
    } catch {
      return reply.code(404).send({ message: 'Produto não encontrado' });
    }
  });
}

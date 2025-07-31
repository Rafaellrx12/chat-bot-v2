import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  description: z.string().optional(),
  link: z.string().url('Link inválido').optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

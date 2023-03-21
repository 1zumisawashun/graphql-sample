// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { readFileSync } from 'fs';
import { join } from 'path';

import currencyFormatter from 'currency-formatter';
import { createSchema, createYoga } from 'graphql-yoga';

import { Resolvers } from '../../../resolvers-types';
import { findOrCreateCart } from '../../lib/cart';
import { prisma } from '../../lib/prisma';

import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const currencyCode = 'USD';

export type GraphQLContext = {
  prisma: PrismaClient;
};

/*eslint-disable @typescript-eslint/require-await*/
export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}

export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
};

const typeDefs = readFileSync(join(process.cwd(), 'schema.graphql'), {
  encoding: 'utf-8',
});

/*eslint-disable @typescript-eslint/restrict-plus-operands*/
const resolvers: Resolvers = {
  Query: {
    cart: async (_, { id }, { prisma }) => {
      return findOrCreateCart(prisma, id);
    },
  },
  Cart: {
    items: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      return items || [];
    },
    totalItems: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      return (items || []).reduce((total, item) => total + item.quantity || 1, 0);
    },
    subTotal: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      const amount = (items || []).reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;

      return {
        amount,
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
      };
    },
  },
  CartItem: {
    unitTotal: (item) => {
      const amount = item.price;
      return {
        amount,
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
      };
    },
    lineTotal: (item) => {
      const amount = item.quantity * item.price;

      return {
        amount,
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
      };
    },
  },
  Mutation: {
    addItem: async (_, { input }, { prisma }) => {
      const cart = await findOrCreateCart(prisma, input.cartId);
      await prisma.cartItem.upsert({
        create: {
          cartId: cart.id,
          id: input.id,
          name: input.name,
          description: input.description,
          image: input.image,
          price: input.price,
          quantity: input.quantity || 1,
        },
        where: { id_cartId: { id: input.id, cartId: cart.id } },
        update: {
          quantity: {
            increment: input.quantity || 1,
          },
        },
      });
      return cart;
    },
    removeItem: async (_, { input }, { prisma }) => {
      const { cartId } = await prisma.cartItem.delete({
        where: { id_cartId: { id: input.id, cartId: input.cartId } },
        select: {
          cartId: true,
        },
      });
      return findOrCreateCart(prisma, cartId);
    },
  },
};

// Create a Yoga instance with a GraphQL schema.

export default createYoga<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({
  /* eslint-disable */
  // @ts-ignore
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  context: createContext(),
  graphqlEndpoint: '/api',
});

// Pass it into a server to hook into request handlers.
/*eslint-disable @typescript-eslint/no-misused-promises*/
// const server = createServer(yoga);

// // Start the server and you're done!
// export default server;

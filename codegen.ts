import type { CodegenConfig } from '@graphql-codegen/cli';

// schemaからtypesを生成する
const config: CodegenConfig = {
  schema: 'schema.graphql',
  generates: {
    './resolvers-types.ts': {
      config: {
        contextType: './src/pages/api/index#GraphQLContext',
        mapperTypeSuffix: 'Model',
        mappers: {
          Cart: '@prisma/client#Cart',
          CartItem: '@prisma/client#CartItem',
        },
      },
      plugins: ['typescript', 'typescript-resolvers'],
    },
  },
};
export default config;

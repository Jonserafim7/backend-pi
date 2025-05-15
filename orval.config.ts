import { defineConfig } from 'orval';

export default defineConfig({
  academic_scheduling_api: {
    // Input path is correct as swagger-spec.json is in the same directory (backend)
    input: './swagger-spec.json',
    output: {
      // workspace: '../frontend/src/api-generated', // Temporarily remove workspace
      target: '../frontend/src/api-generated/client', // Full path from backend
      schemas: '../frontend/src/api-generated/model', // Full path from backend

      // 3. Mode 'tags-split' is excellent for your feature-based structure.
      // It will create subdirectories under 'client/' based on your Swagger tags
      // (e.g., client/auth, client/usuarios, client/blocos-de-horario).
      mode: 'tags-split',

      // 4. Specify a file naming convention for the tag-split files.
      // 'kebab-case' is a common and good choice (e.g., blocos-de-horario.ts).
      namingConvention: 'kebab-case',

      client: 'react-query', // Correct for your stack
      httpClient: 'axios', // Correct for your stack

      prettier: true, // Good: Formats generated code.

      docs: true,

      override: {
        mutator: {
          path: '../frontend/src/lib/orval-axios-instance.ts', // Path relative to orval.config.ts
          name: 'orvalCustomInstance',
        },
        query: {
          // 6. Recommended for React Query (v4/v5+) for more flexible and precise query key management.
          // This will generate query keys as arrays, e.g., ['usuarios', 'list'].
          shouldSplitQueryKey: true,

          // Optional: If you're using a specific version of React Query (e.g., v5)
          // and want to ensure Orval uses settings for it, you can specify it.
          // Orval usually auto-detects this.
          // version: 5,
        },
        // Optional: Suffixes for generated components (schemas, responses, etc.)
        // Your swagger DTOs already have a 'Dto' suffix (e.g., LoginDto).
        // Adding another suffix here (e.g., components: { schemas: { suffix: 'Api' } })
        // would result in names like 'LoginDtoApi'.
        // If you want to change or remove the existing 'Dto' suffix, a custom transformer function
        // would be more appropriate. For now, leaving this out is likely best.
        // components: {
        //   schemas: {
        //     suffix: '', // Or some other desired suffix
        //   },
        // },
      },
    },
    // Optional: If you want to run Prettier explicitly on the entire generated workspace after files are written.
    // The `output.prettier: true` option should already handle formatting of individual files.
    hooks: {
      afterAllFilesWrite:
        'prettier --write ../frontend/src/api-generated/**/*.{ts,tsx}',
    },
  },
  academic_scheduling_api_zod: {
    input: './swagger-spec.json',
    output: {
      target: '../frontend/src/api-generated/zod-schemas',
      client: 'zod',
      mode: 'tags-split',
    },
  },
});

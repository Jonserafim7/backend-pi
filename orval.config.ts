import { defineConfig } from "orval"

const API_URL = process.env.API_URL || "http://localhost:3000"

export default defineConfig({
  academic_scheduling_api: {
    input: `${API_URL}/api-docs-json`,
    output: {
      target: "../frontend-pi/src/api-generated/client",
      schemas: "../frontend-pi/src/api-generated/model",
      mode: "tags-split",
      namingConvention: "kebab-case",
      client: "react-query",
      httpClient: "axios",
      prettier: true,
      override: {
        mutator: {
          path: "../frontend-pi/src/lib/orval-axios-instance.ts",
          name: "orvalCustomInstance",
        },
        query: {
          shouldSplitQueryKey: true,
        },
      },
    },
  },
  academic_scheduling_api_zod: {
    input: `${API_URL}/api-docs-json`,
    output: {
      target: "../frontend-pi/src/api-generated/zod-schemas",
      client: "zod",
      mode: "tags-split",
    },
  },
})

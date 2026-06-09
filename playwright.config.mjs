// Seam-3 e2e config (run via npx, no committed node_modules):
//   npx -y -p @playwright/test playwright test
// Reuses a dev server already listening on :8099, else starts one.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:8099' },
  webServer: {
    command: 'python3 -m http.server 8099',
    port: 8099,
    reuseExistingServer: true,
  },
});

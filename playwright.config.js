const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  webServer: {
    command: "PORT=3100 DATA_FILE=test-data.json node server.js",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 10000,
  },
});

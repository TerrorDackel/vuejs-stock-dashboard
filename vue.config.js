/* Vue CLI dev-server proxy to SheetDB */
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://sheetdb.io',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug',
        pathRewrite: { '^/api': '/api' }
      }
    }
  }
});

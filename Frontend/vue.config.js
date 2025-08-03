const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8081, // Puerto que coincide con la configuración CORS del backend
    host: 'localhost'
  }
})

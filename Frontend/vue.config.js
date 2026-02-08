const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Smart Assistant'
    }
  },
  transpileDependencies: true,
  devServer: {
    port: 8081, // Puerto que coincide con la configuración CORS del backend
    host: 'localhost'
  }
})

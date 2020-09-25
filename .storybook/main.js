const path = require('path');
module.exports = {
  stories: ['../src/components/*.stories.[tj]s'],
  webpackFinal: async (config) => {
    config.resolve.alias = {
      vue$: 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
};

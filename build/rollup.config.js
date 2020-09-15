import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';

export default [
  // ESM build to be used with webpack/rollup.
  {
    input: 'src/index.js',
    output: {
      format: 'esm',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.esm.js',
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      commonjs(),
      vue(),
    ],
    external: ['@vue/composition-api'],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      format: 'cjs',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.cjs.js',
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      commonjs(),
      vue(),
    ],
    external: ['@vue/composition-api'],
  },
  // UMD build.
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.js',
      globals: {
        '@vue/composition-api': 'vueCompositionApi',
      },
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      commonjs(),
      vue(),
    ],
    external: ['@vue/composition-api'],
  },
];

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import vue from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript2';

const extensions = ['.js', '.ts', '.vue'];
const plugins = [
  alias(),
  resolve({ extensions, browser: true }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
  }),
  commonjs(),
  vue(),
  typescript({
    include: [/\.tsx?$/, /\.vue\?.*?lang=ts/],
    useTsconfigDeclarationDir: true,
  }),
];

export default [
  // ESM build to be used with webpack/rollup.
  {
    input: 'src/index.js',
    output: {
      format: 'esm',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.esm.js',
    },
    plugins,
    external: ['@vue/composition-api', 'vue'],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      format: 'cjs',
      exports: 'named',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.cjs.js',
    },
    plugins,
    external: ['@vue/composition-api', 'vue'],
  },
  // UMD build.
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      exports: 'named',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.js',
      globals: {
        '@vue/composition-api': 'vueCompositionApi',
        vue: 'vue',
      },
    },
    plugins,
    external: ['@vue/composition-api', 'vue'],
  },
];

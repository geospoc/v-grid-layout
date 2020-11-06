import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import vue from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const extensions = ['.js', '.ts', '.vue'];
const plugins = [
  alias(),
  resolve({ extensions, browser: true }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
  }),
  commonjs(),
  terser(),
  vue(),
  typescript({
    include: [/\.tsx?$/, /\.vue\?.*?lang=ts/],
    useTsconfigDeclarationDir: true,
  }),
];

export default [
  // UMD
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      exports: 'named',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.min.js',
      globals: {
        '@vue/composition-api': 'vueCompositionApi',
        vue: 'vue',
      },
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
      file: 'dist/v-grid-layout.cjs.min.js',
    },
    plugins,
    external: ['@vue/composition-api', 'vue'],
  },
];

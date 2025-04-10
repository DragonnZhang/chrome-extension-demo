import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';

export default defineConfig({
  environments: {
    web: {
      source: {
        entry: {
          index: './src/index.tsx',
          popup: './src/popup.tsx',
        },
      },
      output: {
        target: 'web',
        sourceMap: true,
      },
      html: {
        tags: [
          {
            tag: 'script',
            attrs: { src: 'scripts/report-template.js' },
            head: true,
            append: true,
          },
        ],
      },
    },
    node: {
      source: {
        entry: {
          'stop-water-flow': './src/scripts/stop-water-flow.ts',
          'water-flow': './src/scripts/water-flow.ts',
        },
      },
      output: {
        target: 'node',
        sourceMap: true,
        filename: {
          js: 'scripts/[name].js',
        },
      },
    },
  },
  dev: {
    writeToDisk: true,
  },
  output: {
    polyfill: 'entry',
    injectStyles: true,
    copy: [
      { from: './static', to: './' },
      {
        from: path.resolve(__dirname, './src/scripts/iife-script'),
        to: 'scripts',
      },
    ],
  },
  resolve: {
    alias: {
      async_hooks: path.join(__dirname, './src/scripts/blank_polyfill.ts'),
      'node:async_hooks': path.join(
        __dirname,
        './src/scripts/blank_polyfill.ts',
      ),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  plugins: [pluginReact(), pluginNodePolyfill(), pluginLess()],
});

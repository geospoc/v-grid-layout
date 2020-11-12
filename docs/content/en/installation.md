---
title: Installation
description: ''
position: 2
category: Getting Started
---

## Prerequisites

Ensure you're logged into GitHub package registry

```bash
$ npm login --registry=https://npm.pkg.github.com --scope=@geospoc
Username: <your github username>
Password: <your personal access token>
Email: (this IS public) <your publicly accessible email address>
Logged in as <your github username> to scope @geospoc on https://npm.pkg.github.com/.
```

Add `@geospoc/v-grid-layout` dependency to your project:

<code-group>
  <code-block label="NPM" active>

```bash
npm install @geospoc/v-grid-layout
```

  </code-block>
  <code-block label="Yarn">

```bash
yarn add @geospoc/v-grid-layout
```

  </code-block>
</code-group>

## Usage 

### As a globally available component

In your `main.js`

```js
import Vue from 'vue';
import VueGridLayout from '@geospoc/v-grid-layout';

Vue.component('grid-layout', VueGridLayout.GridLayout);
Vue.component('grid-item', VueGridLayout.GridItem);
```

You can now use the `<grid-layout></grid-layout>` & `<grid-item></grid-item>` components anywhere in the app

### As a local component

```js
import VueGridLayout from '@geospoc/v-grid-layout';
```

Add to other Vue Components

```js
export default {
  components: {
    GridLayout: VueGridLayout.GridLayout,
    GridItem: VueGridLayout.GridItem,
  },
  // ... data, methods, mounted (), etc.
};
```

### As a Nuxt plugin

To use the package globally in the application, create a new file called as `plugins/grid-layout.js`

```js
import Vue from 'vue';
import VueGridLayout from '@geospoc/v-grid-layout';

Vue.component('grid-layout', VueGridLayout.GridLayout);
Vue.component('grid-item', VueGridLayout.GridItem);
```

Reference the plugin in `nuxt.config.(t/j)s`
```js
...
plugins: [
  { src: '~/plugins/grid-layout', mode: 'client' }
]
...
```

### Browser

Include the browser-ready bundle (download from releases) in your page. The components will be automatically available.

```js
<script src="v-grid-layout.umd.min.js"></script>
```

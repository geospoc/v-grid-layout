---
title: Installation
description: ''
position: 2
category: Getting Started
---

### yarn / npm

Add `@geospoc/v-grid-layout` dependency to your project:

<code-group>
  <code-block label="Yarn" active>

```bash
yarn add  @geospoc/v-grid-layout
```

  </code-block>
  <code-block label="NPM">

```bash
npm install @geospoc/v-grid-layout
```

  </code-block>
</code-group>

Import the library

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

### Browser

Include the browser-ready bundle (download from releases) in your page. The components will be automatically available.

```js
<script src="v-grid-layout.umd.min.js"></script>
```

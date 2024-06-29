<p align="center">
    <a href="https://evomark.co.uk" target="_blank" alt="Link to evoMark's website">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://evomark.co.uk/wp-content/uploads/static/evomark-logo--dark.svg">
          <source media="(prefers-color-scheme: light)" srcset="https://evomark.co.uk/wp-content/uploads/static/evomark-logo--light.svg">
          <img alt="evoMark company logo" src="https://evomark.co.uk/wp-content/uploads/static/evomark-logo--light.svg" width="500">
        </picture>
    </a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/dm/tailwind-web-components.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/tailwind-web-components"><img src="https://img.shields.io/npm/v/tailwind-web-components.svg" alt="Version"></a>
  <a href="https://github.com/evo-mark/tailwind-web-components/blob/main/LICENCE"><img src="https://img.shields.io/github/license/evo-mark/tailwind-web-components?style=flat" alt="Licence"></a>
</p>

# Tailwind Web Components

This is package that enables you to create a web components library powered by Vue3 SFCs and Tailwind without bloating your code in the process.

## Features

- Single Tailwind stylesheet available to all components
- Build your components as Vue3 SFCs
- Use either CSS-in-JS or standard CSS files for Tailwind output
- Sync or Async components supported
- Hot Module Reloading for Web Component styles
- Inlined styles from SFC &lt;style&gt; blocks
- Automatically reads your POSTCSS config

## Installation

```sh
npm i -D tailwind-web-components
# OR
pnpm add -D tailwind-web-components
```

## Usage

```js
// vite.config.js
import { tailwindWebComponents } from "tailwind-web-components";

export default {
  plugins: [
    tailwindWebComponents({
      stylesheet: "./src/css/style.postcss",
    }),
  ],
};
```

```js
// entry.js
import { defineCustomElement } from "virtual:tailwind-web-components";
import { defineAsyncComponent } from "vue";

import SomeSyncComponent from "./components/SomeSyncComponent.ce.vue";
globalThis.customElements.define(
  "twc-some-component",
  defineCustomElement(SomeSyncComponent)
);

const AsyncComponent = defineCustomElement(
  defineAsyncComponent(() => import("./components/AsyncComponent.ce.vue"))
);
globalThis.customElements.define("twc-another-component", AsyncComponent);
```

Note that we're importing `defineCustomElement` from a virtual namespace and **not** the version from "vue".

## Props

In your `vite.config.js` file, you can pass the following props to the Vite plugin

| Prop              | Type    | Default    | Description                                              |
| ----------------- | ------- | ---------- | -------------------------------------------------------- |
| config            | object  |            | The single-object config                                 |
| config.stylesheet | string  | <required> | The path (relative to vite.config.js) of your stylesheet |
| config.vueConfig  | object  | {}         | Config options to pass to the @vitejs-plugin-vue plugin  |
| config.sourceMap  | boolean | false      | Generate inline source-maps for the stylesheet?          |
| config.injectCss  | boolean | true       | Inject the CSS into the document.head using JS           |
| config.minify     | boolean | true       | Minify the CSS output when in production mode            |

### Caveats

- Not tested with SSR yet.
- If you choose not to inject CSS into the document head, it will be duplicated in your JS file.

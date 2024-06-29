import postcssLoadConfig from "postcss-load-config";
import { readFile } from "node:fs/promises";
import vue from "@vitejs/plugin-vue";
import { join } from "node:path";
import postcss from "postcss";
import cssnano from "cssnano";

/**
 * @param { string } style The compiled CSS code to inject
 * @param { boolean } injectCss Should the code be injected into the page head as well?
 * @param { boolean } isProduction Is Vite in production mode?
 *
 * @returns { string } The JavaScript injection code
 */
function generateJavaScriptInject(
  style,
  injectCss = true,
  isProduction = false
) {
  const hmr =
    isProduction !== true
      ? `
    if (import.meta.hot) {
        import.meta.hot.on("twc:reload", (data) => {
            globalThis._TAILWIND_WEB_COMPONENTS_REPLACE(data.content);
        });
    }
    `
      : "";

  return `
  import { VueElement, defineComponent } from "vue";
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(\`${style}\`);
  globalThis._TAILWIND_WEB_COMPONENTS_REPLACE = function(content) {
    sheet.replaceSync(content);
  }
  ${hmr}
  if (globalThis?.document?.head && ${injectCss} && globalThis._TAILWIND_WEB_COMPONENTS_INJECTED !== true) {
    globalThis.document.adoptedStyleSheets.push(sheet);
    globalThis._TAILWIND_WEB_COMPONENTS_INJECTED = true;
  };
  function defineCustomElement(options, hydrate2) {
    const Comp = defineComponent(options);
    class VueCustomElement extends VueElement {
      constructor(initialProps) {
        super(Comp, initialProps, hydrate2);
        const shadow = this.shadowRoot;
        shadow.adoptedStyleSheets = [sheet];
      }
    }
    VueCustomElement.def = Comp;
    return VueCustomElement;
  }
  export { defineCustomElement }
  `;
}

/**
 * @param { string } path The stylesheet path to resolve
 * @param { string } root The root directory of the project
 */
function resolveStylesheetPath(path, root) {
  return path.startsWith("/") ? path : join(root, path);
}

const moduleId = "tailwind-web-components";
const resolvedModuleId = "\0" + moduleId;

/**
 * @typedef { object } TailwindWebComponentsPluginConfig
 * @property { string } stylesheet The relative location of the entry stylesheet
 * @property { Omit<import("@vitejs/plugin-vue").Options, 'customElement'> } vueConfig Configuration options to pass to the vite-vue plugin
 * @property { boolean } sourceMap Generate source maps for your stylesheet
 * @property { boolean } injectCss Should the CSS stylesheet be also injected into the page on load?
 * @property { boolean } minify Should the CSS output be minified?
 *
 * @param { TailwindWebComponentsPluginConfig } pluginConfig
 * @returns { import("vite").Plugin[] } The Vite plugin
 */
export function tailwindWebComponents(pluginConfig) {
  const {
    stylesheet,
    vueConfig = {},
    sourceMap = false,
    injectCss = true,
    minify = true,
  } = pluginConfig;

  let _root,
    _stylesheetCode = "",
    _injectJs = "",
    _server,
    isProduction = false;

  return [
    {
      name: "tailwind-web-components",
      enforce: "pre",

      configureServer(devServer) {
        _server = devServer;
      },

      config(_, { mode }) {
        isProduction = mode === "production";
      },

      async configResolved(config) {
        _root = config.root;

        return {};
      },
      resolveId(id) {
        if (id === moduleId) {
          return resolvedModuleId;
        }
      },
      async load(id) {
        const resolvedConfigStylesheet = resolveStylesheetPath(
          stylesheet,
          _root
        );

        const stylesheetFile = await readFile(resolvedConfigStylesheet, {
          encoding: "utf8",
        });

        const ctx = { map: sourceMap ? "inline" : false };

        _stylesheetCode = await postcssLoadConfig(ctx).then(
          ({ plugins, options }) => {
            options.from = resolvedConfigStylesheet;
            options.map = sourceMap ?? false;

            const postcssPlugins =
              minify && isProduction ? [...plugins, cssnano] : plugins;

            return postcss(postcssPlugins)
              .process(stylesheetFile, options)
              .then((result) =>
                result.css.replace(/\/\*[^#][\s\S]*?\*\//g, "")
              );
          }
        );

        _server?.ws?.send &&
          _server.ws.send({
            type: "custom",
            event: "twc:reload",
            data: {
              content: _stylesheetCode,
            },
          });

        _stylesheetCode = _stylesheetCode.replace(/\\/g, "\\\\");

        _injectJs = generateJavaScriptInject(
          _stylesheetCode,
          injectCss,
          isProduction
        );

        if (id === resolvedModuleId) {
          return _injectJs;
        }
      },
    },
    vue({
      customElement: "*.ce.vue",
      ...vueConfig,
    }),
  ];
}

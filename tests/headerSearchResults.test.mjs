import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const vue = require("vue");
const ts = require("typescript");
const { parse, compileScript } = require("@vue/compiler-sfc");
const { createRouter, createMemoryHistory, useRoute, useRouter } = require("vue-router");
const flush = async () => { for (let i = 0; i < 4; i++) await vue.nextTick(); };
const slotComponent = vue.defineComponent({ setup: (_, { slots }) => () => vue.h("div", slots.default?.()) });

function compile(path, mocks, globals, transform = (source) => source) {
  const { descriptor } = parse(transform(readFileSync(new URL(path, import.meta.url), "utf8")));
  const source = compileScript(descriptor, { id: path, inlineTemplate: true }).content.replaceAll("import.meta.dev", "false");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", ...Object.keys(globals), output)(
    (name) => name === "vue" ? { ...vue, Transition: slotComponent, vModelText: {} } : mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports.default;
}

const node = (tag, text = "") => ({ tag, text, props: {}, children: [], parent: null, focus() {} });
function renderer() {
  const remove = (child) => {
    if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = null;
  };
  return vue.createRenderer({
    createElement: (tag) => node(tag), createText: (text) => node("#text", text), createComment: (text) => node("#comment", text),
    insert(child, parent, anchor) { remove(child); const index = anchor ? parent.children.indexOf(anchor) : -1; parent.children.splice(index < 0 ? parent.children.length : index, 0, child); child.parent = parent; },
    remove, setText: (el, text) => { el.text = text; }, setElementText: (el, text) => { el.text = text; el.children = []; },
    patchProp: (el, key, _old, value) => { el.props[key] = value; }, parentNode: (el) => el.parent,
    nextSibling: (el) => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
  });
}
const all = (root) => [root, ...root.children.flatMap(all)];
const text = (root) => root.text + root.children.map(text).join("");

for (const mobile of [false, true]) {
  test(`actual ${mobile ? "mobile" : "desktop"} suggestions render photos/fallback and View all retains filters`, async (t) => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: slotComponent }] });
    await router.push("/catalog?q=part&make=subaru&model=forester&year=2018&categories=lights,mirrors&brand=tyc&in_stock=true&page=2");
    const runtime = { public: { siteEnv: "development" } };
    const globals = { ...vue, useRoute, useRouter, useRuntimeConfig: () => runtime,
      useEcommerceAnalytics: () => ({ trackSearchSelection() {} }),
      navigateTo: (path) => router.push(path),
      window: { localStorage: { removeItem() {} }, requestAnimationFrame() {} },
    };
    const picture = compile("../app/components/common/BasePicture.vue", {
      "~/composables/media/useCloudinaryImage": { buildOptimizedCloudinaryUrl: (url) => url, getCloudinaryPresetWidths: () => ({ desktop: 112, tablet: 112, mobile: 112 }) },
    }, globals);
    const button = compile("../app/components/common/BaseButton.vue", {}, globals);
    const placeholder = { desktop: "/placeholder.webp", mobile: "/placeholder.webp" };
    const suggestions = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1, name: `Part ${index + 1}`, slug: `part-${index + 1}`, price: "20", in_stock: true,
      fitment_summary: "Subaru Forester 2018", primary_image: { desktop: index ? `/photo-${index}.webp` : null, tablet: null, mobile: null, alt_text: `Photo ${index + 1}` },
    }));
    const header = compile("../app/components/LAYOUTS/HeaderSearch.vue", {
      "@vueuse/core": { onClickOutside() {}, useMediaQuery: () => vue.ref(mobile), useDebounceFn: (fn) => fn },
      "@headlessui/vue": { Dialog: vue.defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => props.open ? vue.h("section", slots.default?.()) : null }), DialogPanel: slotComponent, DialogTitle: slotComponent },
      "./HeaderSearchFilters.vue": { default: vue.defineComponent({ inheritAttrs: false, render: () => null }) },
      "~/components/common/BasePicture.vue": { default: picture },
      "~/composables/catalog/useCatalogApi": { useCatalogApi: () => ({ getCatalogCategoriesRaw: async () => [], getCatalogProductSuggestions: async () => suggestions, getVehicleMakes: async () => [], getVehicleModels: async () => [], getVehicleYears: async () => [] }) },
      "~/composables/catalog/useCatalogPlaceholderMedia": { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: placeholder }) },
      "~/utils/routePaths": { getCatalogCategorySlugFromPath: () => null },
      "~/utils/pageScrollCoordinator": { waitForPageReady: async () => {} },
    }, globals, (source) => source.replace(/defineExpose\(\{\s*openMobileSheet,/, "defineExpose({\n  openDesktopPanel,\n  openMobileSheet,"));
    const root = node("root");
    const app = renderer().createApp(header);
    app.use(router);
    app.component("BaseButton", button);
    app.component("BaseIcon", { render: () => null });
    app.component("NuxtLink", slotComponent);
    const warnings = [];
    app.config.warnHandler = (message) => warnings.push(message);
    const vm = app.mount(root);
    t.after(() => app.unmount());
    await flush();
    await vm[mobile ? "openMobileSheet" : "openDesktopPanel"]();
    await flush();
    const images = all(root).filter((el) => el.tag === "img");
    assert.equal(images.length, 5);
    assert.deepEqual(images.map((el) => el.props.src), ["/placeholder.webp", "/photo-1.webp", "/photo-2.webp", "/photo-3.webp", "/photo-4.webp"]);
    assert.equal(images[1].props.alt, "Photo 2");
    const viewAll = all(root).find((el) => el.tag === "button" && text(el).includes("ყველა შედეგის ნახვა"));
    assert.ok(viewAll, "View all must render below the suggestions");
    await viewAll.props.onClick({});
    await flush();
    assert.equal(router.currentRoute.value.path, "/catalog");
    assert.deepEqual(router.currentRoute.value.query, { brand: "tyc", in_stock: "true", q: "part", make: "subaru", model: "forester", year: "2018", categories: "lights,mirrors" });
    assert.deepEqual(warnings, []);
  });
}

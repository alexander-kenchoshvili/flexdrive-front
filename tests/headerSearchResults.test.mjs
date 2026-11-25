import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { catalogSearchTextRuntime } from "./helpers/catalogSearchText.mjs";

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
    (name) => name === "vue" ? { ...vue, Transition: slotComponent, Teleport: slotComponent, vModelText: {} } : mocks[name] ?? require(name), exports, ...Object.values(globals),
  );
  return exports.default;
}

const node = (tag, text = "") => ({ tag, text, props: {}, style: {}, children: [], parent: null, focus() {} });
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
      "~/composables/catalog/useVinSearchMarketing": { useVinSearchMarketing: () => ({ track: () => {} }) },
      "~/composables/catalog/useVehicleInterestTracking": { useVehicleInterestTracking: () => ({ capture: async () => {} }) },
    "~/composables/catalog/useCatalogSearchText": { useCatalogSearchText: catalogSearchTextRuntime(useRoute) },
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
    assert.equal(images.length, mobile ? 3 : 5);
    assert.deepEqual(images.map((el) => el.props.src), ["/placeholder.webp", "/photo-1.webp", "/photo-2.webp", "/photo-3.webp", "/photo-4.webp"].slice(0, mobile ? 3 : 5));
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


for (const mobile of [false, true]) {
  test(`VIN has no transient loading text and retains failure in actual ${mobile ? "mobile" : "desktop"} template`, async (t) => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: slotComponent }] });
    await router.push("/");
    let resolve;
    const globals = { ...vue, useRoute, useRouter,
      useEcommerceAnalytics: () => ({ trackSearchSelection() {} }),
      navigateTo: (path) => router.push(path),
      window: { localStorage: { removeItem() {} }, requestAnimationFrame() {} },
    };
    const header = compile("../app/components/LAYOUTS/HeaderSearch.vue", {
      "~/composables/catalog/useVinSearchMarketing": { useVinSearchMarketing: () => ({ track: () => {} }) },
      "~/composables/catalog/useVehicleInterestTracking": { useVehicleInterestTracking: () => ({ capture: async () => {} }) },
    "~/composables/catalog/useCatalogSearchText": { useCatalogSearchText: catalogSearchTextRuntime(useRoute) },
      "@vueuse/core": { onClickOutside() {}, useMediaQuery: () => vue.ref(mobile), useDebounceFn: (fn) => fn },
      "@headlessui/vue": { Dialog: vue.defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => props.open ? vue.h("section", slots.default?.()) : null }), DialogPanel: slotComponent, DialogTitle: slotComponent },
      "./HeaderSearchFilters.vue": { default: vue.defineComponent({ inheritAttrs: false, render: () => null }) },
      "~/components/common/BasePicture.vue": { default: slotComponent },
      "~/composables/catalog/useCatalogApi": { useCatalogApi: () => ({
        getCatalogCategoriesRaw: async () => [], getCatalogProductSuggestions: async () => { throw new Error("VIN must not become product suggestions"); },
        getVehicleMakes: async () => [], getVehicleModels: async () => [], getVehicleYears: async () => [],
        decodeVehicleVin: () => new Promise((r) => { resolve = r; }),
      }) },
      "~/composables/catalog/useCatalogPlaceholderMedia": { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) },
      "~/utils/routePaths": { getCatalogCategorySlugFromPath: () => null },
      "~/utils/pageScrollCoordinator": { waitForPageReady: async () => {} },
    }, globals, (source) => source.replace(/defineExpose\(\{\s*openMobileSheet,/, "defineExpose({ searchText, submitSearch, openDesktopPanel, openMobileSheet,"));
    const root = node("root");
    const app = renderer().createApp(header);
    app.use(router);
    app.component("BaseButton", slotComponent);
    app.component("BaseIcon", { render: () => null });
    app.component("NuxtLink", slotComponent);
    const warnings = [];
    app.config.warnHandler = (message) => warnings.push(message);
    const vm = app.mount(root);
    t.after(() => app.unmount());
    vm.searchText = "1HGCM82633A004352";
    await vm[mobile ? "openMobileSheet" : "openDesktopPanel"]();
    const pending = vm.submitSearch();
    await flush();
    assert.equal(all(root).find((el) => el.props.role === "status"), undefined);
    assert.doesNotMatch(text(root), /ავტომობილს ვეძებთ/);
    resolve({ status: "no_coverage", vehicle: { make: "Honda", model: "Accord", year: 2003 } });
    await pending;
    await flush();
    const status = all(root).find((el) => el.props.role === "status");
    assert.ok(status);
    assert.match(text(status), /Honda Accord.*2003/);
    assert.match(text(status), /ნაწილები ჯერ არ გვაქვს/);
    assert.equal(router.currentRoute.value.path, "/");
    assert.deepEqual(warnings, []);
  });
}


test("compact mobile trigger opens a single shared query input and retains drafts until one explicit search", async () => {
  for (const width of [375, 768, 769]) {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: slotComponent }] });
    await router.push("/checkout");
    const navigations = [];
    const originalPush = router.push.bind(router);
    let navigation = Promise.resolve();
    router.push = (target) => { navigations.push(target); navigation = originalPush(target); return navigation; };
    const globals = { ...vue, useRoute, useRouter, useEcommerceAnalytics: () => ({ trackSearchSelection() {} }),
      navigateTo: (target) => router.push(target),
      window: { localStorage: { removeItem() {} }, requestAnimationFrame() {} },
    };
    const filters = vue.defineComponent({ props: ["make", "model", "year", "hideActions"], setup: (props, { emit }) => () => vue.h("div", { "data-filters": "true", "data-car": `${props.make}:${props.model}:${props.year}` }, [
      ...[["make", "subaru"], ["model", "forester"], ["year", "2018"]].map(([key, value]) => vue.h("button", { type: "button", "data-pick": key, onClick: () => emit(key, value) }, value)),
      ...(!props.hideActions ? [vue.h("button", { type: "button", "data-apply": "true", onClick: () => emit("search") }, "ძებნა")] : []),
    ]) });
    const header = compile("../app/components/LAYOUTS/HeaderSearch.vue", {
      "~/composables/catalog/useVinSearchMarketing": { useVinSearchMarketing: () => ({ track() {} }) },
      "~/composables/catalog/useVehicleInterestTracking": { useVehicleInterestTracking: () => ({ capture: async () => {} }) },
      "~/composables/catalog/useCatalogSearchText": { useCatalogSearchText: catalogSearchTextRuntime(useRoute) },
      "@vueuse/core": { onClickOutside() {}, useMediaQuery: (query) => vue.ref(width <= Number(/max-width: (\d+)px/.exec(query)[1])), useDebounceFn: (fn) => fn },
      "@headlessui/vue": { Dialog: vue.defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => props.open ? vue.h("section", { "data-dialog": "true" }, slots.default?.()) : null }), DialogPanel: slotComponent, DialogTitle: slotComponent },
      "./HeaderSearchFilters.vue": { default: filters }, "~/components/common/BasePicture.vue": { default: slotComponent },
      "~/composables/catalog/useCatalogApi": { useCatalogApi: () => ({ getCatalogCategoriesRaw: async () => [], getCatalogProductSuggestions: async () => [], getVehicleMakes: async () => [{ name: "Subaru", slug: "subaru" }], getVehicleModels: async () => [{ name: "Forester", slug: "forester" }], getVehicleYears: async () => [{ year: 2018 }] }) },
      "~/composables/catalog/useCatalogPlaceholderMedia": { useCatalogPlaceholderMedia: () => ({ cardPlaceholderImage: {} }) },
      "~/utils/routePaths": { getCatalogCategorySlugFromPath: () => null }, "~/utils/pageScrollCoordinator": { waitForPageReady: async () => {} },
    }, globals, (source) => source.replace(/<Teleport\b[^>]*>/g, "<div>").replace(/<\/Teleport>/g, "</div>").replace(/defineExpose\(\{\s*openMobileSheet,/, "defineExpose({ searchText, openMobileSheet,"));
    const root = node("root"), app = renderer().createApp(header, { inline: true, collapseMobileFilters: true });
    app.use(router);
    app.component("BaseButton", { setup: (_, { slots }) => () => vue.h("button", { type: "button" }, slots.default?.()) });
    app.component("BaseIcon", slotComponent); app.component("NuxtLink", slotComponent);
    // Teleport is a slot stub in this renderer; only its known slot-normalization warning is expected.
    app.config.warnHandler = (message) => assert.match(message, /Non-function value encountered for default slot/);
    const vm = app.mount(root);
    try {
      await flush();
      assert.equal(all(root).filter((el) => el.tag === "input").length, width <= 768 ? 0 : 1);
      const trigger = all(root).find((el) => el.props["aria-haspopup"] === "dialog");
      if (width > 768) { assert.equal(trigger, undefined); assert.equal(all(root).filter((el) => el.props["data-filters"]).length, 1); continue; }
      assert.ok(trigger); assert.equal(trigger.props.type, "button");
      assert.equal(all(root).filter((el) => el.props["data-filters"]).length, 0);
      await trigger.props.onClick(); await flush();
      const queryInput = all(root).find((el) => el.tag === "input");
      assert.ok(queryInput);
      queryInput.props["onUpdate:modelValue"]("კაპოტი"); await flush();
      assert.equal(all(root).filter((el) => el.props["data-filters"]).length, 1);
      assert.equal(all(root).filter((el) => el.tag === "input").length, 1, "Only the panel has an editable query field");
      assert.equal(all(root).filter((el) => el.props.role === "search").length, 1);
      assert.equal(all(root).filter((el) => el.props["data-apply"]).length, 0, "The filter child must not add a second submit action");
      for (const key of ["make", "model", "year"]) { await all(root).find((el) => el.props["data-pick"] === key).props.onClick(); await flush(); }
      await all(root).find((el) => el.props["aria-label"] === "ძიების დახურვა").props.onClick(); await flush();
      assert.equal(navigations.length, 0); assert.equal(vm.searchText, "კაპოტი");
      assert.equal(all(root).filter((el) => el.tag === "input").length, 0);
      assert.match(text(all(root).find((el) => el.props["aria-haspopup"] === "dialog")), /კაპოტი/);
      await trigger.props.onClick(); await flush();
      assert.equal(all(root).find((el) => el.props["data-filters"]).props["data-car"], "subaru:forester:2018");
      const dialog = all(root).find((el) => el.props["data-dialog"]);
      const apply = all(dialog).filter((el) => el.tag === "button" && text(el) === "ძებნა");
      assert.equal(apply.length, 1);
      await apply[0].props.onClick(); await flush();
      await navigation; await flush();
      assert.equal(navigations.length, 1); assert.equal(router.currentRoute.value.path, "/catalog");
      assert.deepEqual(router.currentRoute.value.query, { q: "კაპოტი", make: "subaru", model: "forester", year: "2018" });
    } finally { app.unmount(); }
  }
});

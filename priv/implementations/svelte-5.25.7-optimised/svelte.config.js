import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  compilerOptions: {
    runes: true, // make sure it uses exclusively the new runes syntax
  },
  preprocess: vitePreprocess(),
};

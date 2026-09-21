/** Vite's `?raw` import suffix, used by the MDX pages that render a .md file. */
declare module '*.md?raw' {
  const content: string;
  export default content;
}

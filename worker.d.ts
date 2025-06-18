declare module '*?worker' {
  const content: new () => Worker;
  export default content;
}
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_APP_WINDOW_TITLE: string
  // más variables de entorno...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

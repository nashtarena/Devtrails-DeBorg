import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Note: lovable-tagger is optional and not required for web builds
let plugins: any[] = [react()];
try {
  const { componentTagger } = require("lovable-tagger");
  plugins = [react(), componentTagger()];
} catch (e) {
  // lovable-tagger not available, continue without it
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      "react-native/Libraries/EventEmitter/NativeEventEmitter": "react-native-web/dist/vendor/react-native/NativeEventEmitter",
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    exclude: ["react-native-vector-icons", "@expo/vector-icons", "react-native-worklets"],
    esbuildOptions: {
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
}));

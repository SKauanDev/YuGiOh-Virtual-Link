import { cp } from "node:fs/promises";

await cp(new URL("../neos-assets/", import.meta.url), new URL("../dist/neos-assets/", import.meta.url), { recursive: true });

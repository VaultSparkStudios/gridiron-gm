import { copyFileSync } from "fs";
import { join } from "path";

const dist = join(process.cwd(), "dist");
copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
console.log("postbuild-pages: copied index.html -> 404.html");

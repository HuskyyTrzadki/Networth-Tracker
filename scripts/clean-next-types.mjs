import { rmSync } from "node:fs";

rmSync(".next/types", { recursive: true, force: true });
rmSync(".next/dev/types", { recursive: true, force: true });


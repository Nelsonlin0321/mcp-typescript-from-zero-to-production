**Module 0 — Foundations**

Before you write your first MCP server you need a modern Node.js runtime, TypeScript, and Zod. This article lists the exact prerequisites and the commands to create a clean project that matches the rest of the tutorial.

## Prerequisites

| Requirement             | Minimum   | Why                                                                       |
| ----------------------- | --------- | ------------------------------------------------------------------------- |
| **Node.js**             | 20+       | LTS features, native fetch, and the runtime used by the official examples |
| **TypeScript**          | 5.x / 6.x | The SDK is written in TypeScript and expects modern TS                    |
| **Zod**                 | 4.x       | Standard Schema implementation used for tool and prompt schemas           |
| **npm** (or pnpm / bun) | recent    | Package manager                                                           |

The SDK also runs on Bun and Deno, but this tutorial uses Node.js 20+ so the examples stay identical to the official guides.

![Environment Setup](imagine_images/lTbBJ.jpg)

*Node.js 20+, TypeScript, and Zod are the three pieces you need.*

## Create a Project

```bash
mkdir 01-prerequisites-environment-setup
cd 01-prerequisites-environment-setup
npm init -y
```

```bash
mkdir 01-register-tool-with-zod
cd 01-register-tool-with-zod
npm init -y
```

Make the project ESM (required by the SDK examples):

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Install the runtime and development dependencies:

```bash
npm install @modelcontextprotocol/server zod
npm install -D typescript tsx @types/node
```

(You will add `@modelcontextprotocol/client` later when you build clients.)

## TypeScript Configuration

Create `tsconfig.jsontsconfig.jsontsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

Note: TypeScript 6+ no longer auto-includes `@types/*`. The `"types": ["node"]` line is required so `Buffer` and other Node types resolve correctly with the published `.d.mts` files.

## Minimal Folder Layout

```shellscript
my-mcp-server/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

## Verify the Setup

Create `src/index.ts` with a one-line smoke test:

```ts
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

console.log('MCP SDK and Zod loaded');
const server = new McpServer({ name: 'smoke', version: '0.0.1' });
console.log(server); // should print the server object
```

Run it:

```bash
npx tsx src/index.ts
```

You should see the log lines with no import errors. If TypeScript complains about missing types, double-check the `"types": ["node"]` setting and that `@types/node` is installed.

## Optional but Recommended

* **MCP Inspector** — the official visual debugger for MCP servers. Install globally or use `npx @modelcontextprotocol/inspector`.

* **VS Code / Cursor / Claude Code** — so you can connect the server you build as a real host later.

* **Git** — initialize a repository so you can track the progressive examples.

## What You’ll Do Next

Your environment is ready. In Module 1 you will use this exact project layout to register your first tool with `registerTool`, serve it with `serveStdio`, and test it with the MCP Inspector and a real host.

***

**Official references**

* [Build a server (first-server guide)](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server)

* [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)

* [Node.js downloads](https://nodejs.org/)

# Contributing to @datashift/sdk

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/datashift-io/typescript-sdk.git
cd typescript-sdk
npm install
```

## Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `npm run build`      | Build the package          |
| `npm run dev`        | Build in watch mode        |
| `npm test`           | Run tests                  |
| `npm run lint`       | Lint source files          |
| `npm run typecheck`  | Run TypeScript type checks |

## Workflow

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Ensure all checks pass: `npm run typecheck && npm run lint && npm test && npm run build`
5. Open a pull request against `main`

## Code Style

- TypeScript strict mode is enabled
- Follow existing patterns in the codebase
- Keep public API surface minimal and well-typed

## Reporting Issues

Use [GitHub Issues](https://github.com/datashift-io/typescript-sdk/issues) for bugs and feature requests. For security vulnerabilities, see [SECURITY.md](.github/SECURITY.md).

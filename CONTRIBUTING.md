# Contributing to Verdkomunumo

Thanks for your interest in contributing.

## Ground rules

- Be respectful and constructive in all interactions.
- Open an issue first for major changes so maintainers can review scope.
- Keep pull requests focused and small whenever possible.

## Development setup

```bash
bun install
bun run dev
```

Useful checks before opening a PR:

```bash
bun run typecheck
bun run test
bun run build
```

## Pull request checklist

- [ ] Code compiles and checks pass locally.
- [ ] New behavior is documented in `README.md` when applicable.
- [ ] If adding dependencies, confirm license compatibility with MIT.
- [ ] Add or update tests for user-facing behavior when feasible.

## Commit style

Use clear, imperative commit messages, for example:

- `Add MIT license and contribution docs`
- `Fix profile image upload validation`

## Licensing and contribution terms

By submitting a contribution, you agree that your contribution is licensed under
this repository's MIT License.

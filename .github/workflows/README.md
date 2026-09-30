# CI workflow

The foundation gate runs on pull requests and pushes to main:

1. install dependencies;
2. lint;
3. typecheck;
4. unit tests;
5. production build;
6. Playwright Chromium smoke;
7. upload foundation and Playwright evidence.

The foundation currently pins Node 24.21.0 LTS, pnpm 12.7.0 and the baseline package versions from Issue #1. A committed pnpm lockfile should be introduced before the foundation is considered fully reproducible across dependency resolution environments.

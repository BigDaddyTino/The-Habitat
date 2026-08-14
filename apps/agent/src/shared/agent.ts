// Source-mode adapter for tests/dev. The staged build replaces this emitted
// wrapper with the compiled shared runtime so production has no workspace
// package or TypeScript-source dependency.
export { isStablePlayerProviderKey } from "@habitat/shared/agent";

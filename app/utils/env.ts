export function isLocalEnvironment(): boolean {
  return window.location.hostname === "localhost";
}

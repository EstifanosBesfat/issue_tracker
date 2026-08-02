/**
 * Navigate to a project detail page with a full document load.
 * Client-side transitions into `/projects/[id]` can hang/crash in the
 * current Next.js client runtime, so prefer a hard navigation.
 */
export function goToProject(projectId: string): void {
  if (!projectId) return;
  window.location.assign(`/projects/${projectId}`);
}

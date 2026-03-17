const MCX_LIBRARY_PREVIEW_PATH_RE = /\/(?:\.da\/library\/blocks|library\/blocks|blocks)\/(mcx-[^/.]+)(?:\.plain\.html)?\/?$/;

export function getMcxLibraryPreviewBlockName(pathname = window.location.pathname) {
  const match = pathname.match(MCX_LIBRARY_PREVIEW_PATH_RE);
  return match ? match[1] : null;
}

export function isMcxLibraryPreviewPath(pathname = window.location.pathname) {
  return Boolean(getMcxLibraryPreviewBlockName(pathname));
}

export { MCX_LIBRARY_PREVIEW_PATH_RE };

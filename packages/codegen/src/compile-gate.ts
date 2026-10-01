// biome-ignore-all format: deterministic generator fixture is reviewed as a semantic artifact
// biome-ignore-all lint/style/useTemplate: generated-source assembly intentionally uses explicit fragments
import ts from "typescript";

export type CompileDiagnostic = { file: string; message: string; line?: number; character?: number };
export type CompileGateResult = { passed: boolean; diagnostics: CompileDiagnostic[]; filesChecked: number };

export function runCompileGate(files: readonly { path: string; content: string }[]): CompileGateResult {
  const diagnostics: CompileDiagnostic[] = [];
  const sourceFiles = files.filter((file) => /\.(tsx|ts)$/.test(file.path));
  for (const file of sourceFiles) {
    const result = ts.transpileModule(file.content, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, strict: true, esModuleInterop: true }, reportDiagnostics: true });
    for (const diagnostic of result.diagnostics ?? []) {
      const position = diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
      diagnostics.push({ file: file.path, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "), line: position ? position.line + 1 : undefined, character: position ? position.character + 1 : undefined });
    }
  }
  return { passed: diagnostics.length === 0, diagnostics, filesChecked: sourceFiles.length };
}
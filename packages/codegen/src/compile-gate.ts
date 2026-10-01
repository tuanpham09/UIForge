import ts from "typescript";

export type CompileDiagnostic = {
  file: string;
  message: string;
  line?: number;
  character?: number;
};

export type CompileGateResult = {
  passed: boolean;
  diagnostics: CompileDiagnostic[];
  filesChecked: number;
};

function diagnosticFor(diagnostic: ts.Diagnostic): CompileDiagnostic {
  const file = diagnostic.file;
  const position = file && diagnostic.start !== undefined ? file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
  return {
    file: file?.fileName ?? "<program>",
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    line: position ? position.line + 1 : undefined,
    character: position ? position.character + 1 : undefined,
  };
}

export function runCompileGate(files: readonly { path: string; content: string }[]): CompileGateResult {
  const sourceFiles = files.filter((file) => /\.(tsx|ts)$/.test(file.path));
  const virtualFiles = new Map<string, string>(sourceFiles.map((file) => ["/" + file.path, file.content]));
  virtualFiles.set(
    "/__uiforge-runtime.d.ts",
    [
      'declare module "react" { export type ReactNode = unknown; }',
      'declare module "react/jsx-runtime" { export const jsx: unknown; export const jsxs: unknown; export const Fragment: unknown; }',
      'declare module "*.css" { const value: string; export default value; }',
      "declare namespace JSX { interface IntrinsicElements { [elementName: string]: Record<string, unknown>; } }",
      ...[...new Set(
        sourceFiles.flatMap((file) => [...file.content.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1])),
      )]
        .filter((source) => source !== "react" && source !== "react/jsx-runtime" && !source.endsWith(".css"))
        .map((source) => 'declare module "' + source + '" { export const Button: any; export const Card: any; export const Input: any; }'),
    ].join("\n"),
  );

  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    allowJs: false,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (fileName) => virtualFiles.has(fileName) || defaultHost.fileExists(fileName),
    readFile: (fileName) => virtualFiles.get(fileName) ?? defaultHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion) => {
      const text = virtualFiles.get(fileName);
      return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion, true) : defaultHost.getSourceFile(fileName, languageVersion);
    },
    getCurrentDirectory: () => "/",
    writeFile: () => undefined,
  };

  const roots = [...virtualFiles.keys()];
  const program = ts.createProgram(roots, options, host);
  const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()]
    .filter((diagnostic) => diagnostic.file?.fileName !== "/__uiforge-runtime.d.ts")
    .map(diagnosticFor);

  return { passed: diagnostics.length === 0, diagnostics, filesChecked: sourceFiles.length };
}

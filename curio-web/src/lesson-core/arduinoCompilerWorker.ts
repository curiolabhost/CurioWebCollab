export function createArduinoCompilerWorker(): Worker {
  return new Worker("/clang/worker.js");
}

export type CompileRequest = {
  code: string;
};

export type CompileResponse = {
  ok: boolean;
  errors?: { line: number; column?: number; message: string }[];
  notices?: string[];
};
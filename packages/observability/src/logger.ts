export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  request_id?: string;
  run_id?: string;
  tenant_id?: string;
  context?: Record<string, unknown>;
}

export function createLogger(env: string, minLevel: LogLevel = 'info') {
  const levelOrder: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const minLevelOrder = levelOrder[minLevel];

  function log(entry: Omit<LogEntry, 'timestamp'>): void {
    if (levelOrder[entry.level] < minLevelOrder) return;

    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    if (env === 'production') {
      console.log(JSON.stringify(fullEntry));
    } else {
      const prefix = `[${entry.level.toUpperCase()}]`;
      const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      console.log(`${prefix} ${entry.message}${ctx}`);
    }
  }

  return {
    debug: (message: string, context?: Record<string, unknown>) => log({ level: 'debug', message, context }),
    info: (message: string, context?: Record<string, unknown>) => log({ level: 'info', message, context }),
    warn: (message: string, context?: Record<string, unknown>) => log({ level: 'warn', message, context }),
    error: (message: string, context?: Record<string, unknown>) => log({ level: 'error', message, context }),
  };
}

'use client';

import { TerminalSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

export function LogDrawer({ logs, payloadSummary }: { logs: string[]; payloadSummary: string }) {
  const [open, setOpen] = useState(false);
  const renderedLogs = useMemo(() => {
    if (logs.length > 0) return logs;
    return ['[INFO] Calling engine...', `[INFO] Payload: ${payloadSummary}`, `[INFO] Timestamp: ${new Date().toISOString()}`];
  }, [logs, payloadSummary]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        <TerminalSquare className="mr-2 h-4 w-4" /> &gt;_
      </Button>
      {open ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-64 border-t bg-slate-950 p-4 text-xs text-emerald-300">
          <div className="mb-2 font-semibold text-emerald-200">Terminal Logs</div>
          <div className="max-h-52 overflow-auto space-y-1 font-mono">
            {renderedLogs.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

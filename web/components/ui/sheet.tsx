'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({ className, ...props }: Dialog.DialogContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/30" />
      <Dialog.Content
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-slate-200 bg-white p-6 shadow-2xl focus:outline-none',
          className
        )}
        {...props}
      >
        {props.children}
        <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-slate-600 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

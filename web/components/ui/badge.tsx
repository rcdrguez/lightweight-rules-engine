import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-slate-900 text-white',
      secondary: 'bg-slate-100 text-slate-800',
      success: 'bg-emerald-100 text-emerald-700',
      danger: 'bg-rose-100 text-rose-700',
      warning: 'bg-amber-100 text-amber-700'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

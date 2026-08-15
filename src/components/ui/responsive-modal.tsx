import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * One surface, two presentations.
 *
 * Desktop keeps the familiar centred dialog. On a phone the same content is a
 * bottom drawer that fills most of the viewport and scrolls internally, so
 * long forms (the post editor) stay usable with one thumb. Consumers render a
 * sticky footer themselves via `footer`, which is pinned outside the scroll
 * area so Save/Cancel are always reachable.
 */
export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Desktop max-width utility. Defaults to a comfortable form width. */
  className?: string;
}

const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "sm:max-w-2xl",
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] border-border/40 bg-background">
          <DrawerHeader className="text-left border-b border-border/30 pb-3">
            <DrawerTitle className="font-display text-base text-foreground">
              {title}
            </DrawerTitle>
            {description && (
              <DrawerDescription className="text-cream-muted text-xs">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="overflow-y-auto overscroll-contain px-4 py-4 flex-1">
            {children}
          </div>
          {footer && (
            <div className="border-t border-border/30 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${className} max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden`}
      >
        <DialogHeader className="border-b border-border/30 px-6 py-4 text-left">
          <DialogTitle className="font-display text-lg text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-cream-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer && (
          <div className="border-t border-border/30 bg-background/95 px-6 py-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveModal;

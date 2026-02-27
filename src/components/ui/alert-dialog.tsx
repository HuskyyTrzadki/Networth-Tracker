"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

import { buttonVariants } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;

type AlertDialogContentProps = React.ComponentPropsWithoutRef<typeof DialogContent>;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  AlertDialogContentProps
>(({ className, ...props }, ref) => (
  <DialogContent
    className={cn("max-w-[420px] border border-border/70 bg-card/96", className)}
    ref={ref}
    role="alertdialog"
    {...props}
  />
));
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = DialogHeader;
const AlertDialogFooter = DialogFooter;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;

type AlertDialogCancelProps = React.ComponentPropsWithoutRef<"button">;

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant: "outline" }), "rounded-full", className)}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
AlertDialogCancel.displayName = "AlertDialogCancel";

type AlertDialogActionProps = React.ComponentPropsWithoutRef<"button">;

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant: "destructive" }), "rounded-full", className)}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
AlertDialogAction.displayName = "AlertDialogAction";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};

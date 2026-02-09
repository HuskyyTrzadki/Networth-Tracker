"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";

import { CreatePortfolioDialog } from "./CreatePortfolioDialog";

export function CreateFirstPortfolioAction() {
  const router = useRouter();

  return (
    <CreatePortfolioDialog
      onCreated={(createdId) => {
        router.push(`/portfolio?portfolio=${createdId}`);
        router.refresh();
      }}
      trigger={({ open, disabled }) => (
        <Button
          className="h-11 w-full sm:w-auto"
          disabled={disabled}
          onClick={open}
          type="button"
        >
          Utwórz pierwszy portfel
        </Button>
      )}
    />
  );
}

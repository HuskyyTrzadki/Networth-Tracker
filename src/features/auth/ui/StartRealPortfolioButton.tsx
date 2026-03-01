import { Button } from "@/features/design-system/components/ui/button";

import { startRealPortfolioFromDemoAction } from "../server/start-real-portfolio-from-demo-action";

type Props = Readonly<{
  className?: string;
  label?: string;
}>;

export function StartRealPortfolioButton({
  className,
  label = "Załóż własny portfel",
}: Props) {
  return (
    <form action={startRealPortfolioFromDemoAction}>
      <Button className={className} type="submit">
        {label}
      </Button>
    </form>
  );
}

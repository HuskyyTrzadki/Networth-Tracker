import { newsreader } from "@/app/fonts";
import { AuthSettingsSectionSkeleton } from "@/features/auth/ui/AuthSettingsSectionSkeleton";

export default function SettingsLoading() {
  return (
    <main className={`mx-auto w-full max-w-4xl px-6 py-10 lg:px-8 ${newsreader.variable}`}>
      <div className="space-y-6">
        <AuthSettingsSectionSkeleton />
      </div>
    </main>
  );
}

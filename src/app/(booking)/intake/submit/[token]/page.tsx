import LeadIntakeFormView from "@/components/intake/LeadIntakeFormView";
import Image from "next/image";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

export default async function LeadIntakeSubmitPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image
            src={LOGO_URL}
            alt="Bendre"
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-lg font-sans font-bold text-sage">Bendre</span>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-card rounded-card shadow-sm border border-border p-6 sm:p-8">
          <LeadIntakeFormView token={token} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-ink-tertiary/50">
          Powered by{" "}
          <span className="font-semibold text-sage/50">Bendre</span>
        </p>
      </footer>
    </div>
  );
}

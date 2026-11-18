import type { Metadata } from "next";
import { TourView } from "@/components/tanitim/tour-view";

export const metadata: Metadata = {
  title: "Platform Tanıtımı — Solar BOM",
};

/** Sol menüdeki “Platform Tanıtımı” — uygulama kabuğu içinde (üst bar 56px + sayfa boşluğu 32px). */
export default function PlatformTanitimiPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <TourView top={56 + 32} />
    </main>
  );
}

import { PlatformsView } from "@/components/common/platforms-view";

export default function PlatformsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <PlatformsView current="bom" />
    </main>
  );
}

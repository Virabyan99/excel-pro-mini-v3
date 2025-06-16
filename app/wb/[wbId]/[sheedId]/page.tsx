import { Sheet } from '@/components/Sheet';

interface PageProps {
  params: { wbId: string; sheetId: string };
}

export default function SheetPage({ params }: PageProps) {
  const { wbId, sheetId } = params;
  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      <Sheet sheetId={`${wbId}/${sheetId}`} />
    </main>
  );
}
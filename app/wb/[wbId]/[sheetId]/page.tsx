import { SheetWrapper } from '@/components/SheetWrapper';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ wbId: string; sheetId: string }>;
}

export default async function SheetPage({ params }: PageProps) {
  const { wbId, sheetId } = await params;
  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      <SheetWrapper sheetId={`${wbId}/${sheetId}`} />
    </main>
  );
}
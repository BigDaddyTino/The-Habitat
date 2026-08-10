import { RecordHall } from "@/components/record-hall";

export default async function HallOfShamePage({ searchParams }: { searchParams: Promise<{ game?: string; player?: string }> }) {
  return <RecordHall hall="SHAME" action="/hall-of-shame" searchParams={await searchParams} />;
}

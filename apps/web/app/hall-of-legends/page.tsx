import { RecordHall } from "@/components/record-hall";

export default async function HallOfLegendsPage({ searchParams }: { searchParams: Promise<{ game?: string; player?: string }> }) {
  return <RecordHall hall="LEGENDS" action="/hall-of-legends" searchParams={await searchParams} />;
}

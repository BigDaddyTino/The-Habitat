import { HallsGateway } from "@/components/halls-gateway";
import { getRecordHallData } from "@/lib/record-data";

export default async function HallsPage() {
  const [legends, shame] = await Promise.all([getRecordHallData("LEGENDS"), getRecordHallData("SHAME")]);
  const legendHeld = legends.definitions.filter((record) => record.currentHolder).length;
  const shameHeld = shame.definitions.filter((record) => record.currentHolder).length;

  return <div className="halls-landing">
    <header className="halls-intro">
      <p className="eyebrow">The Habitat record chambers</p>
      <h1>Two halls.<br /><span>One reputation.</span></h1>
      <p>Every name here is backed by trusted Habitat evidence. Head left for the feats worth chasing. Head right for the mistakes worth framing.</p>
      <div className="halls-intro-rule" aria-hidden="true"><i /><b>VS</b><i /></div>
    </header>
    <HallsGateway
      legends={{ activeRecords: legends.definitions.length, heldRecords: legendHeld }}
      shame={{ activeRecords: shame.definitions.length, heldRecords: shameHeld }}
    />
    <footer className="halls-oath">
      <span>Verified evidence only</span><i />
      <strong>No invented feats. No invented failures.</strong><i />
      <span>Permanent clubhouse record</span>
    </footer>
  </div>;
}

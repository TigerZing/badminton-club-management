import { Card, PageHeader } from "@/components/ui/card";
import { EventForm } from "@/components/event-form";
import { createEventAction } from "@/server/actions/admin";
import { listVenues } from "@/server/services/venues";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  const venues = await listVenues({ activeOnly: true });
  return (
    <>
      <PageHeader title="New event" description="It starts as a draft. Open registration when it is ready." />
      <Card>
        <EventForm action={createEventAction} venues={venues} />
      </Card>
    </>
  );
}

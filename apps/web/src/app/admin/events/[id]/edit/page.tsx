import { notFound } from "next/navigation";
import { prisma } from "@club/db";
import { Card, PageHeader } from "@/components/ui/card";
import { EventForm } from "@/components/event-form";
import { updateEventAction } from "@/server/actions/admin";
import { listVenues } from "@/server/services/venues";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, venues] = await Promise.all([prisma.event.findUnique({ where: { id } }), listVenues({ activeOnly: true })]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title="Edit event" />
      <Card>
        <EventForm action={updateEventAction} venues={venues} event={event} />
      </Card>
    </>
  );
}

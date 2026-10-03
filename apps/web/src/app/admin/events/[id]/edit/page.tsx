import { notFound } from "next/navigation";
import { prisma } from "@club/db";
import { Card, PageHeader } from "@/components/ui/card";
import { EventForm } from "@/components/event-form";
import { getT } from "@/lib/i18n/server";
import { updateEventAction } from "@/server/actions/admin";
import { listVenues } from "@/server/services/venues";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminEvents.editEvent") };
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, venues] = await Promise.all([prisma.event.findUnique({ where: { id } }), listVenues({ activeOnly: true })]);
  if (!event) notFound();
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("adminEvents.editEvent")} />
      <Card>
        <EventForm action={updateEventAction} venues={venues} event={event} />
      </Card>
    </>
  );
}

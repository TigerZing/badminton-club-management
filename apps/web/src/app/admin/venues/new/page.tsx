import { Card, PageHeader } from "@/components/ui/card";
import { VenueForm } from "@/components/venue-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminVenues.add") };
}

export default async function NewVenuePage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("adminVenues.add")} />
      <Card>
        <VenueForm />
      </Card>
    </>
  );
}

import { Card, PageHeader } from "@/components/ui/card";
import { VenueForm } from "@/components/venue-form";

export const metadata = { title: "Add venue" };

export default function NewVenuePage() {
  return (
    <>
      <PageHeader title="Add venue" />
      <Card>
        <VenueForm />
      </Card>
    </>
  );
}

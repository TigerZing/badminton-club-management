import { Card, PageHeader } from "@/components/ui/card";
import { MemberForm } from "@/components/member-form";

export const metadata = { title: "Add member" };

export default function NewMemberPage() {
  return (
    <>
      <PageHeader title="Add member" description="Create an account for someone who has not signed up themselves." />
      <Card>
        <MemberForm />
      </Card>
    </>
  );
}

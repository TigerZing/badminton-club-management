import { Card, PageHeader } from "@/components/ui/card";
import { MemberForm } from "@/components/member-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminMembers.add") };
}

export default async function NewMemberPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("adminMembers.add")} description={t("adminMembers.addDescription")} />
      <Card>
        <MemberForm />
      </Card>
    </>
  );
}

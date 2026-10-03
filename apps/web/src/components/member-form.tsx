import type { User } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { createMemberAction, updateMemberAction } from "@/server/actions/admin";

/** Admin form to add a member, or edit one when `member` is given. */
export async function MemberForm({ member }: { member?: User }) {
  const { t } = await getT();
  return (
    <ActionForm action={member ? updateMemberAction : createMemberAction}>
      {member && <input type="hidden" name="userId" value={member.id} />}
      <Field label={t("adminMembers.name")} htmlFor="name">
        <Input id="name" name="name" defaultValue={member?.name} required />
      </Field>
      <Field label={t("adminMembers.email")} htmlFor="email" hint={t("adminMembers.emailHint")}>
        <Input id="email" name="email" type="email" defaultValue={member?.email} required />
      </Field>
      <Field label={t("adminMembers.phone")} htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={member?.phone ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("adminMembers.skill")} htmlFor="skillLevel">
          <Input id="skillLevel" name="skillLevel" type="number" min={1} max={10} defaultValue={member?.skillLevel ?? 5} required />
        </Field>
        <Field label={t("adminMembers.role")} htmlFor="role">
          <Select id="role" name="role" defaultValue={member?.role ?? "MEMBER"}>
            <option value="MEMBER">{t("adminMembers.roleMember")}</option>
            <option value="ADMIN">{t("adminMembers.roleAdmin")}</option>
          </Select>
        </Field>
      </div>
      {member ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={member.isActive} className="size-4 accent-primary" />
          {t("adminMembers.activeLabel")}
        </label>
      ) : (
        <Field label={t("adminMembers.tempPassword")} htmlFor="password" hint={t("adminMembers.tempPasswordHint")}>
          <Input id="password" name="password" type="text" autoComplete="off" minLength={8} required />
        </Field>
      )}
      <SubmitButton className="justify-self-start">{member ? t("adminMembers.saveChanges") : t("adminMembers.add")}</SubmitButton>
    </ActionForm>
  );
}

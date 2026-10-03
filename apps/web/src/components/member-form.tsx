import type { User } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { createMemberAction, updateMemberAction } from "@/server/actions/admin";

/** Admin form to add a member, or edit one when `member` is given. */
export function MemberForm({ member }: { member?: User }) {
  return (
    <ActionForm action={member ? updateMemberAction : createMemberAction}>
      {member && <input type="hidden" name="userId" value={member.id} />}
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" defaultValue={member?.name} required />
      </Field>
      <Field label="Email" htmlFor="email" hint="Used to sign in">
        <Input id="email" name="email" type="email" defaultValue={member?.email} required />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={member?.phone ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Skill (1–10)" htmlFor="skillLevel">
          <Input id="skillLevel" name="skillLevel" type="number" min={1} max={10} defaultValue={member?.skillLevel ?? 5} required />
        </Field>
        <Field label="Role" htmlFor="role">
          <Select id="role" name="role" defaultValue={member?.role ?? "MEMBER"}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
      </div>
      {member ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={member.isActive} className="size-4 accent-primary" />
          Active member (inactive members cannot sign in)
        </label>
      ) : (
        <Field label="Temporary password" htmlFor="password" hint="At least 8 characters. Share it with the member; they can change it under Me.">
          <Input id="password" name="password" type="text" autoComplete="off" minLength={8} required />
        </Field>
      )}
      <SubmitButton className="justify-self-start">{member ? "Save changes" : "Add member"}</SubmitButton>
    </ActionForm>
  );
}

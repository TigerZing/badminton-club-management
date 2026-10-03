import { z } from "zod";

const email = z.string().trim().toLowerCase().email("errors.enterValidEmail");
const id = z.string().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors.pickDate");
const time = z.string().regex(/^\d{2}:\d{2}$/, "errors.pickTime");
const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null)
  .nullish();
const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.string().url("errors.enterFullUrl").nullable())
  .nullish();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "errors.enterPassword"),
});

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "errors.enterYourName").max(80),
  email,
  password: z.string().min(8, "errors.passwordTooShort").max(100),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "errors.enterYourName").max(80),
  phone: optionalText,
});

const password = z.string().min(8, "errors.passwordTooShort").max(100);
const memberFields = {
  name: z.string().trim().min(2, "errors.enterName").max(80),
  email,
  phone: optionalText,
  skillLevel: z.coerce.number().int().min(1, "errors.skillRange").max(10, "errors.skillRange"),
  role: z.enum(["MEMBER", "ADMIN"]),
};

export const createMemberSchema = z.object({ ...memberFields, password });

export const updateMemberSchema = z.object({ ...memberFields, userId: id, isActive: z.coerce.boolean() });

export const resetPasswordSchema = z.object({ userId: id, password });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "errors.enterCurrentPassword"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "errors.passwordsDontMatch", path: ["confirmPassword"] });

export const eventSchema = z
  .object({
    title: z.string().trim().min(2, "errors.enterTitle").max(100),
    venueId: optionalText,
    date,
    startTime: time,
    endTime: time,
    courtCount: z.coerce.number().int().min(1, "errors.atLeastOneCourt").max(30),
    maxPlayers: z.coerce.number().int().min(4, "errors.atLeastFourPlayers").max(200),
    deadlineDate: date,
    deadlineTime: time,
    notes: optionalText,
  })
  .refine((v) => v.endTime > v.startTime, { message: "errors.endAfterStart", path: ["endTime"] });

export const eventStatusSchema = z.object({
  eventId: id,
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const venueSchema = z.object({
  id: optionalText,
  name: z.string().trim().min(2, "errors.enterName").max(100),
  address: optionalText,
  mapUrl: optionalUrl,
  bookingUrl: optionalUrl,
  crawlerKey: optionalText,
  phone: optionalText,
  website: optionalUrl,
  description: optionalText,
  bookingInfo: optionalText,
  isActive: z.coerce.boolean(),
});

export const courtSchema = z.object({
  venueId: id,
  name: z.string().trim().min(1, "errors.enterCourtName").max(50),
});

export const slotSchema = z
  .object({
    venueId: id,
    courtId: id,
    date,
    startTime: time,
    endTime: time,
    price: z.coerce.number().int().min(0).optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "errors.endAfterStart", path: ["endTime"] });

export const scoreSchema = z.object({
  matchId: id,
  scoreA: z.coerce.number().int().min(0).max(99),
  scoreB: z.coerce.number().int().min(0).max(99),
});

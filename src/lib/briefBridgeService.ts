// src/lib/briefBridgeService.ts
//
// Client-side data layer for BriefBridge. Follows the same pattern the rest of
// Orchestra already uses (App.tsx talks to Firestore directly via the client SDK —
// see /users/{userId}/history, /sharedRuns, etc.) rather than introducing a parallel
// REST/firebase-admin layer: Firestore Security Rules do the authorization, this
// file just shapes the reads and writes.
//
// Two collections:
//   /users/{userId}/briefbridge/config        — private, full IntakeFormConfig (owner only)
//   /intakeTokens/{token}                     — public mirror (no notificationEmails/userId),
//                                                readable by anyone, written only by the owner.
//   /users/{userId}/enquiries/{enquiryId}     — private submissions; created by an
//                                                unauthenticated visitor whose payload matches
//                                                a published /intakeTokens/{token}, read/updated/
//                                                deleted only by the owner. See firestore.rules.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import type {
  Enquiry,
  EnquiryStatus,
  IntakeFormConfig,
  PublicIntakeFormConfig,
  PublicIntakeSubmission,
} from "@/src/types/briefBridge";

function stripUndefined<T>(val: T): T {
  if (val === undefined) return null as any;
  if (val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(stripUndefined) as any;
  const out: any = {};
  for (const [k, v] of Object.entries(val as any)) out[k] = stripUndefined(v);
  return out;
}

const configDocRef = (userId: string) => doc(db, "users", userId, "briefbridge", "config");
const publicTokenDocRef = (token: string) => doc(db, "intakeTokens", token);
const enquiriesColRef = (userId: string) => collection(db, "users", userId, "enquiries");
const enquiryDocRef = (userId: string, enquiryId: string) => doc(db, "users", userId, "enquiries", enquiryId);

// --- Config (admin) --------------------------------------------------------

export function subscribeIntakeConfig(userId: string, cb: (config: IntakeFormConfig | null) => void): Unsubscribe {
  return onSnapshot(configDocRef(userId), snap => {
    cb(snap.exists() ? (snap.data() as IntakeFormConfig) : null);
  });
}

/**
 * Saves the private config and its public-safe mirror in one atomic batch, so the
 * two can never drift out of sync (e.g. a form left mid-save that's publicly
 * readable but has no matching private record, or vice versa).
 */
export async function saveIntakeConfig(config: IntakeFormConfig): Promise<void> {
  const { notificationEmails, userId, ...publicFields } = stripUndefined(config) as IntakeFormConfig;
  const publicConfig: PublicIntakeFormConfig = publicFields as PublicIntakeFormConfig;
  const batch = writeBatch(db);
  batch.set(configDocRef(config.userId), { ...stripUndefined(config), updatedAt: new Date().toISOString() });
  batch.set(publicTokenDocRef(config.token), {
    ...publicConfig,
    userId: config.userId, // kept so Firestore rules can verify enquiry.userId against the token owner
    updatedAt: new Date().toISOString(),
  });
  await batch.commit();
}

// --- Public intake portal ---------------------------------------------------

export async function fetchPublicIntakeForm(token: string): Promise<PublicIntakeFormConfig | null> {
  const snap = await getDoc(publicTokenDocRef(token));
  if (!snap.exists()) return null;
  const data = snap.data() as PublicIntakeFormConfig & { isPublished: boolean };
  if (!data.isPublished) return null;
  return data;
}

export interface SubmitIntakeResult {
  enquiryId: string;
}

/**
 * Writes the enquiry directly to the owner's private subcollection. Firestore
 * rules (not this function) are what make this safe for an unauthenticated
 * caller: the rule re-checks that `token` still resolves to a published,
 * matching /intakeTokens/{token} document before allowing the create.
 */
export async function submitPublicIntake(
  token: string,
  ownerUserId: string,
  submission: PublicIntakeSubmission
): Promise<SubmitIntakeResult> {
  if (submission._gotcha) {
    // Honeypot tripped — pretend success so a bot doesn't learn to look elsewhere,
    // but never actually write the doc.
    return { enquiryId: "" };
  }
  const { _gotcha, ...clean } = submission;
  const now = new Date().toISOString();
  const enquiry: Omit<Enquiry, "id"> = {
    ...clean,
    userId: ownerUserId,
    token,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  const ref = doc(enquiriesColRef(ownerUserId));
  await setDoc(ref, stripUndefined(enquiry));

  // Best-effort, non-blocking email notification. The API key lives server-side —
  // see /api/briefbridge/notify — so failures here should never block submission
  // from the client's point of view.
  fetch("/api/briefbridge/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerUserId, token, enquiryId: ref.id, ...clean }),
  }).catch(() => {});

  return { enquiryId: ref.id };
}

// --- Enquiry Hub (admin) -----------------------------------------------------

export function subscribeEnquiries(userId: string, cb: (enquiries: Enquiry[]) => void): Unsubscribe {
  const q = query(enquiriesColRef(userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry)));
  });
}

export async function updateEnquiryStatus(userId: string, enquiryId: string, status: EnquiryStatus): Promise<void> {
  await updateDoc(enquiryDocRef(userId, enquiryId), { status, updatedAt: new Date().toISOString() });
}

export async function updateEnquiryNotes(userId: string, enquiryId: string, internalNotes: string): Promise<void> {
  await updateDoc(enquiryDocRef(userId, enquiryId), { internalNotes, updatedAt: new Date().toISOString() });
}

export async function deleteEnquiry(userId: string, enquiryId: string): Promise<void> {
  await deleteDoc(enquiryDocRef(userId, enquiryId));
}

// --- Export -------------------------------------------------------------------

export function enquiriesToCsv(enquiries: Enquiry[]): string {
  const headers = [
    "id", "clientFirstName", "clientSurname", "clientEmail", "clientCompany", "projectTitle", "budgetTier",
    "targetLaunch", "status", "createdAt",
  ];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = enquiries.map(e => headers.map(h => escape((e as any)[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function enquiriesToJson(enquiries: Enquiry[]): string {
  return JSON.stringify(enquiries, null, 2);
}

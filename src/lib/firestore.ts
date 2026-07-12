import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Entry, EntryFormData, UserSettings } from "@/types";

const ENTRIES_COLLECTION = "entries";
const SETTINGS_COLLECTION = "userSettings";

// ─── Entry CRUD ─────────────────────────────────────────────

/** Create a new entry */
export async function createEntry(
  userId: string,
  data: EntryFormData
): Promise<string> {
  const totalSeconds = data.minutesCompleted * 60 + data.secondsCompleted;
  const now = Timestamp.now();

  const entryData: Record<string, unknown> = {
    userId,
    date: Timestamp.fromDate(data.date),
    brand: data.brand || "",
    show: data.show || "",
    minutesCompleted: data.minutesCompleted,
    secondsCompleted: data.secondsCompleted,
    totalSeconds,
    corrections: data.corrections || "",
    createdAt: now,
    updatedAt: now,
  };

  // Tag with team if creating a team entry
  if (data.teamId) {
    entryData.teamId = data.teamId;
    entryData.teamName = data.teamName || "";
  }

  // Save mentioned teammates
  if (data.mentionedUsers && data.mentionedUsers.length > 0) {
    entryData.mentionedUsers = data.mentionedUsers;
  }

  const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), entryData);

  return docRef.id;
}

/** Update an existing entry */
export async function updateEntry(
  entryId: string,
  data: Partial<EntryFormData>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (data.date !== undefined) updateData.date = Timestamp.fromDate(data.date);
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.show !== undefined) updateData.show = data.show;
  if (data.minutesCompleted !== undefined)
    updateData.minutesCompleted = data.minutesCompleted;
  if (data.secondsCompleted !== undefined)
    updateData.secondsCompleted = data.secondsCompleted;
  if (
    data.minutesCompleted !== undefined ||
    data.secondsCompleted !== undefined
  ) {
    const mins = data.minutesCompleted ?? 0;
    const secs = data.secondsCompleted ?? 0;
    updateData.totalSeconds = mins * 60 + secs;
  }
  if (data.corrections !== undefined) updateData.corrections = data.corrections;

  await updateDoc(doc(db, ENTRIES_COLLECTION, entryId), updateData);
}

/** Delete an entry */
export async function deleteEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, ENTRIES_COLLECTION, entryId));
}

// ─── Real-time Listeners ────────────────────────────────────

/** Subscribe to all entries for a user, ordered by date descending */
export function subscribeToEntries(
  userId: string,
  callback: (entries: Entry[]) => void
): () => void {
  const q = query(
    collection(db, ENTRIES_COLLECTION),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const entries: Entry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Entry[];
    callback(entries);
  });
}

/** Subscribe to entries tagged with a specific teamId */
export function subscribeToTeamTaggedEntries(
  teamId: string,
  callback: (entries: Entry[]) => void
): () => void {
  const q = query(
    collection(db, ENTRIES_COLLECTION),
    where("teamId", "==", teamId),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const entries: Entry[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Entry[];
    callback(entries);
  });
}

// ─── User Settings ──────────────────────────────────────────

/** Get user settings */
export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserSettings) : null;
}

/** Set or update user settings */
export async function setUserSettings(
  userId: string,
  dailyGoalMinutes: number
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const now = Timestamp.now();
  await setDoc(
    docRef,
    {
      dailyGoalMinutes,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );
}

/** Subscribe to user settings in real-time */
export function subscribeToSettings(
  userId: string,
  callback: (settings: UserSettings | null) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  return onSnapshot(docRef, (docSnap) => {
    callback(docSnap.exists() ? (docSnap.data() as UserSettings) : null);
  });
}

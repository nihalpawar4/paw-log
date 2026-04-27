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

  const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
    userId,
    date: Timestamp.fromDate(data.date),
    minutesCompleted: data.minutesCompleted,
    secondsCompleted: data.secondsCompleted,
    totalSeconds,
    topic: data.topic,
    description: data.description,
    timeGiven: data.timeGiven,
    notes: data.notes || "",
    createdAt: now,
    updatedAt: now,
  });

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
  if (data.topic !== undefined) updateData.topic = data.topic;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.timeGiven !== undefined) updateData.timeGiven = data.timeGiven;
  if (data.notes !== undefined) updateData.notes = data.notes;

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

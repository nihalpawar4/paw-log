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
  getDocs,
  setDoc,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Team,
  TeamFormData,
  TeamMember,
  TeamInvite,
  TeamActivity,
  ActivityType,
  TeamRole,
} from "@/types/teams";
import { Entry } from "@/types";

// ─── Collection Names ───────────────────────────────────────

const TEAMS = "teams";
const TEAM_MEMBERS = "teamMembers";
const TEAM_INVITES = "teamInvites";
const TEAM_ACTIVITIES = "teamActivities";
const ENTRIES = "entries";

// ─── Helpers ────────────────────────────────────────────────

/** Generate a unique team code like TEAM-8XK29A */
function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for clarity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TEAM-${code}`;
}

// ─── Team CRUD ──────────────────────────────────────────────

/** Create a new team */
export async function createTeam(
  userId: string,
  userName: string,
  userPhotoURL: string,
  data: TeamFormData
): Promise<string> {
  const now = Timestamp.now();
  const teamCode = generateTeamCode();

  // Create team document
  const teamRef = await addDoc(collection(db, TEAMS), {
    name: data.name.trim(),
    description: data.description.trim(),
    avatar: data.avatar || "👥",
    ownerId: userId,
    ownerName: userName,
    teamCode,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  // Add creator as owner member
  await addDoc(collection(db, TEAM_MEMBERS), {
    teamId: teamRef.id,
    userId,
    displayName: userName,
    photoURL: userPhotoURL || "",
    role: "owner" as TeamRole,
    joinedAt: now,
    lastActiveAt: now,
  });

  // Create invite document for team code
  await setDoc(doc(db, TEAM_INVITES, teamCode), {
    teamId: teamRef.id,
    teamName: data.name.trim(),
    createdBy: userId,
    createdAt: now,
  });

  // Log activity
  await logActivity(teamRef.id, userId, userName, userPhotoURL, "joined", `${userName} created the team`);

  return teamRef.id;
}

/** Update team details (owner only) */
export async function updateTeam(
  teamId: string,
  data: Partial<TeamFormData>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  await updateDoc(doc(db, TEAMS, teamId), updateData);
}

/** Delete a team and all related data */
export async function deleteTeam(teamId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all members
  const membersSnap = await getDocs(
    query(collection(db, TEAM_MEMBERS), where("teamId", "==", teamId))
  );
  membersSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete all activities
  const activitiesSnap = await getDocs(
    query(collection(db, TEAM_ACTIVITIES), where("teamId", "==", teamId))
  );
  activitiesSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete invites for this team
  const invitesSnap = await getDocs(
    query(collection(db, TEAM_INVITES), where("teamId", "==", teamId))
  );
  invitesSnap.docs.forEach((d) => batch.delete(d.ref));

  // Delete team itself
  batch.delete(doc(db, TEAMS, teamId));

  await batch.commit();
}

/** Subscribe to a single team */
export function subscribeToTeam(
  teamId: string,
  callback: (team: Team | null) => void
): () => void {
  return onSnapshot(doc(db, TEAMS, teamId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Team);
    } else {
      callback(null);
    }
  });
}

// ─── Membership ─────────────────────────────────────────────

/** Get teams the user belongs to */
export function subscribeToUserTeams(
  userId: string,
  callback: (teams: Team[]) => void
): () => void {
  const q = query(
    collection(db, TEAM_MEMBERS),
    where("userId", "==", userId)
  );

  return onSnapshot(q, async (snapshot) => {
    const teamIds = snapshot.docs.map((d) => d.data().teamId as string);

    if (teamIds.length === 0) {
      callback([]);
      return;
    }

    // Fetch each team doc
    const teams: Team[] = [];
    for (const tid of teamIds) {
      const teamSnap = await getDoc(doc(db, TEAMS, tid));
      if (teamSnap.exists()) {
        teams.push({ id: teamSnap.id, ...teamSnap.data() } as Team);
      }
    }

    // Sort by most recently updated
    teams.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    callback(teams);
  });
}

/** Subscribe to all members of a team */
export function subscribeToTeamMembers(
  teamId: string,
  callback: (members: TeamMember[]) => void
): () => void {
  const q = query(
    collection(db, TEAM_MEMBERS),
    where("teamId", "==", teamId),
    orderBy("joinedAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as TeamMember[];
    callback(members);
  });
}

/** Join a team via invite code */
export async function joinTeamByCode(
  code: string,
  userId: string,
  userName: string,
  userPhotoURL: string
): Promise<string> {
  // Look up the invite
  const inviteSnap = await getDoc(doc(db, TEAM_INVITES, code));
  if (!inviteSnap.exists()) {
    throw new Error("Invalid invite code");
  }

  const invite = inviteSnap.data() as Omit<TeamInvite, "id">;

  // Check if already a member
  const existingMember = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", invite.teamId),
      where("userId", "==", userId)
    )
  );

  if (!existingMember.empty) {
    return invite.teamId; // Already a member, just return team ID
  }

  const now = Timestamp.now();

  // CRITICAL: Add as member — this is the essential operation
  await addDoc(collection(db, TEAM_MEMBERS), {
    teamId: invite.teamId,
    userId,
    displayName: userName,
    photoURL: userPhotoURL || "",
    role: "member" as TeamRole,
    joinedAt: now,
    lastActiveAt: now,
  });

  // NON-CRITICAL: Update member count and log activity
  // These should not fail the join if they encounter permission issues
  try {
    const teamSnap = await getDoc(doc(db, TEAMS, invite.teamId));
    if (teamSnap.exists()) {
      const currentCount = (teamSnap.data() as Team).memberCount || 0;
      await updateDoc(doc(db, TEAMS, invite.teamId), {
        memberCount: currentCount + 1,
        updatedAt: now,
      });
    }
  } catch (e) {
    console.warn("Failed to update member count (non-critical):", e);
  }

  try {
    await logActivity(invite.teamId, userId, userName, userPhotoURL, "joined", `${userName} joined the team`);
  } catch (e) {
    console.warn("Failed to log join activity (non-critical):", e);
  }

  return invite.teamId;
}

/** Leave a team */
export async function leaveTeam(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string
): Promise<void> {
  const membersSnap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", userId)
    )
  );

  if (!membersSnap.empty) {
    await deleteDoc(membersSnap.docs[0].ref);

    // Decrement member count
    const teamSnap = await getDoc(doc(db, TEAMS, teamId));
    if (teamSnap.exists()) {
      const currentCount = (teamSnap.data() as Team).memberCount || 0;
      await updateDoc(doc(db, TEAMS, teamId), {
        memberCount: Math.max(0, currentCount - 1),
        updatedAt: Timestamp.now(),
      });
    }

    await logActivity(teamId, userId, userName, userPhotoURL, "left", `${userName} left the team`);
  }
}

/** Remove a member (owner only) */
export async function removeMember(
  teamId: string,
  targetUserId: string,
  targetUserName: string,
  ownerName: string,
  ownerPhotoURL: string,
  ownerId: string
): Promise<void> {
  const membersSnap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", targetUserId)
    )
  );

  if (!membersSnap.empty) {
    await deleteDoc(membersSnap.docs[0].ref);

    const teamSnap = await getDoc(doc(db, TEAMS, teamId));
    if (teamSnap.exists()) {
      const currentCount = (teamSnap.data() as Team).memberCount || 0;
      await updateDoc(doc(db, TEAMS, teamId), {
        memberCount: Math.max(0, currentCount - 1),
        updatedAt: Timestamp.now(),
      });
    }

    await logActivity(
      teamId,
      ownerId,
      ownerName,
      ownerPhotoURL,
      "member_removed",
      `${ownerName} removed ${targetUserName}`
    );
  }
}

/** Transfer ownership */
export async function transferOwnership(
  teamId: string,
  currentOwnerId: string,
  newOwnerId: string,
  newOwnerName: string,
  currentOwnerName: string,
  currentOwnerPhotoURL: string
): Promise<void> {
  const batch = writeBatch(db);

  // Update team owner
  batch.update(doc(db, TEAMS, teamId), {
    ownerId: newOwnerId,
    ownerName: newOwnerName,
    updatedAt: Timestamp.now(),
  });

  // Update old owner role → member
  const oldOwnerSnap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", currentOwnerId)
    )
  );
  if (!oldOwnerSnap.empty) {
    batch.update(oldOwnerSnap.docs[0].ref, { role: "member" });
  }

  // Update new owner role → owner
  const newOwnerSnap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", newOwnerId)
    )
  );
  if (!newOwnerSnap.empty) {
    batch.update(newOwnerSnap.docs[0].ref, { role: "owner" });
  }

  await batch.commit();

  await logActivity(
    teamId,
    currentOwnerId,
    currentOwnerName,
    currentOwnerPhotoURL,
    "ownership_transferred",
    `${currentOwnerName} transferred ownership to ${newOwnerName}`
  );
}

/** Update member's last active timestamp */
export async function updateMemberActivity(
  teamId: string,
  userId: string
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", userId)
    )
  );
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { lastActiveAt: Timestamp.now() });
  }
}

/** Get user's membership for a specific team */
export async function getUserMembership(
  teamId: string,
  userId: string
): Promise<TeamMember | null> {
  const snap = await getDocs(
    query(
      collection(db, TEAM_MEMBERS),
      where("teamId", "==", teamId),
      where("userId", "==", userId)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as TeamMember;
}

// ─── Activity Feed ──────────────────────────────────────────

/** Log an activity */
async function logActivity(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string,
  type: ActivityType,
  message: string
): Promise<void> {
  await addDoc(collection(db, TEAM_ACTIVITIES), {
    teamId,
    userId,
    userName,
    userPhotoURL: userPhotoURL || "",
    type,
    message,
    createdAt: Timestamp.now(),
  });
}

/** Public wrapper to log entry creation activity */
export async function logEntryActivity(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string
): Promise<void> {
  await logActivity(
    teamId,
    userId,
    userName,
    userPhotoURL,
    "entry_created",
    `${userName} created a new log entry`
  );
}

/** Log entry update activity */
export async function logEntryUpdatedActivity(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string
): Promise<void> {
  await logActivity(
    teamId,
    userId,
    userName,
    userPhotoURL,
    "entry_updated",
    `${userName} updated a log entry`
  );
}

/** Log entry deletion activity */
export async function logEntryDeletedActivity(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string
): Promise<void> {
  await logActivity(
    teamId,
    userId,
    userName,
    userPhotoURL,
    "entry_deleted",
    `${userName} deleted a log entry`
  );
}

/** Log teammate mention activity */
export async function logMentionActivity(
  teamId: string,
  userId: string,
  userName: string,
  userPhotoURL: string,
  mentionedNames: string[]
): Promise<void> {
  const names = mentionedNames.join(", ");
  await logActivity(
    teamId,
    userId,
    userName,
    userPhotoURL,
    "entry_mentioned",
    `${userName} tagged ${names} in an entry`
  );
}

/** Subscribe to team activities */
export function subscribeToTeamActivities(
  teamId: string,
  maxItems: number,
  callback: (activities: TeamActivity[]) => void
): () => void {
  const q = query(
    collection(db, TEAM_ACTIVITIES),
    where("teamId", "==", teamId),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as TeamActivity[];
    callback(activities);
  });
}

// ─── Read Member Entries (read-only) ────────────────────────

/** Subscribe to entries of a specific user (for team member profile view) */
export function subscribeToMemberEntries(
  userId: string,
  callback: (entries: Entry[]) => void
): () => void {
  const q = query(
    collection(db, ENTRIES),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Entry[];
    callback(entries);
  });
}

/** Get all entries for multiple users (for team analytics) */
export function subscribeToTeamEntries(
  userIds: string[],
  callback: (entries: Entry[]) => void
): () => void {
  if (userIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore 'in' queries support up to 30 values
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += 30) {
    chunks.push(userIds.slice(i, i + 30));
  }

  const allEntries: Map<string, Entry> = new Map();
  const unsubscribes: (() => void)[] = [];

  chunks.forEach((chunk) => {
    const q = query(
      collection(db, ENTRIES),
      where("userId", "in", chunk),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((d) => {
        allEntries.set(d.id, { id: d.id, ...d.data() } as Entry);
      });
      // Convert map to sorted array
      const sorted = Array.from(allEntries.values()).sort(
        (a, b) => b.date.toMillis() - a.date.toMillis()
      );
      callback(sorted);
    });

    unsubscribes.push(unsub);
  });

  return () => unsubscribes.forEach((u) => u());
}

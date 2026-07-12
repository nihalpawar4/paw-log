import { Timestamp } from "firebase/firestore";

// ─── Team ───────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar: string; // emoji
  ownerId: string;
  ownerName: string;
  teamCode: string; // e.g. "TEAM-8XK29A"
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamFormData {
  name: string;
  description: string;
  avatar: string;
}

// ─── Team Member ────────────────────────────────────────────

export type TeamRole = "owner" | "member";

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  displayName: string;
  photoURL: string;
  role: TeamRole;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

// ─── Team Invite ────────────────────────────────────────────

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  createdBy: string;
  createdAt: Timestamp;
}

// ─── Team Activity ──────────────────────────────────────────

export type ActivityType =
  | "joined"
  | "left"
  | "entry_created"
  | "entry_updated"
  | "entry_deleted"
  | "entry_mentioned"
  | "streak_milestone"
  | "member_removed"
  | "ownership_transferred";

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  type: ActivityType;
  message: string;
  createdAt: Timestamp;
}

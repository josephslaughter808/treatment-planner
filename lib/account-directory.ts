export type UserRole = "admin" | "front-desk" | "provider";

export type AccountProfile = {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title: string;
  phone: string;
  avatarColor: string;
  bio: string;
  avatarDataUrl?: string;
};

export const demoAccounts: AccountProfile[] = [
  {
    id: "acct-claire",
    practiceId: "clearpath-default",
    name: "Claire Morgan",
    email: "claire@clearpathdemo.com",
    password: "clearpath123",
    role: "admin",
    title: "Practice Administrator",
    phone: "(555) 201-4400",
    avatarColor: "#0f766e",
    bio: "Leads implementation, training, and patient education standards for the office."
  },
  {
    id: "acct-mia",
    practiceId: "clearpath-default",
    name: "Mia Alvarez",
    email: "mia@clearpathdemo.com",
    password: "clearpath123",
    role: "front-desk",
    title: "Front Desk Coordinator",
    phone: "(555) 201-4401",
    avatarColor: "#c28c2c",
    bio: "Builds cases, prepares patient packages, and follows up on education and consent delivery."
  },
  {
    id: "dr-adams",
    practiceId: "clearpath-default",
    name: "Dr. Adams",
    email: "adams@clearpathdemo.com",
    password: "clearpath123",
    role: "provider",
    title: "General Dentist",
    phone: "(555) 201-4402",
    avatarColor: "#7c3aed",
    bio: "Focuses on restorative diagnosis, patient communication, and long-term treatment planning."
  },
  {
    id: "acct-sara",
    practiceId: "river-oaks-endo",
    name: "Sara Nguyen",
    email: "sara@riveroaksendo.com",
    password: "clearpath123",
    role: "front-desk",
    title: "Scheduling and Case Acceptance",
    phone: "(555) 730-1180",
    avatarColor: "#d97706",
    bio: "Coordinates endodontic referrals, patient education delivery, and consent workflows."
  },
  {
    id: "dr-brooks",
    practiceId: "river-oaks-endo",
    name: "Dr. Brooks",
    email: "brooks@riveroaksendo.com",
    password: "clearpath123",
    role: "provider",
    title: "Endodontist",
    phone: "(555) 730-1181",
    avatarColor: "#2563eb",
    bio: "Specializes in pain diagnosis, root canal therapy, and endodontic retreatment."
  },
  {
    id: "dr-clark",
    practiceId: "river-oaks-endo",
    name: "Dr. Clark",
    email: "clark@riveroaksendo.com",
    password: "clearpath123",
    role: "provider",
    title: "Endodontist",
    phone: "(555) 730-1182",
    avatarColor: "#be123c",
    bio: "Handles urgent infection cases and advanced endodontic treatment planning."
  }
];

export const authStorageKeys = {
  profiles: "clearpath-auth-profiles",
  sessionUserId: "clearpath-auth-session"
};

export const roles: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Practice admin" },
  { value: "front-desk", label: "Front desk" },
  { value: "provider", label: "Provider" }
];

export function getAccountsForPractice(practiceId: string, accounts: AccountProfile[] = demoAccounts) {
  return accounts.filter((account) => account.practiceId === practiceId);
}

export function getProvidersFromAccounts(
  practiceId: string,
  accounts: AccountProfile[] = demoAccounts
) {
  return accounts.filter(
    (account) => account.practiceId === practiceId && account.role === "provider"
  );
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

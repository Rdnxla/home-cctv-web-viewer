export interface ClientUser {
  id: number;
  name: string;
  avatar: string;
  clientSince: string;
  sports: string[];
}

export interface ClientSummary {
  upcomingSessions: number;
  waitlisted: number;
  totalSpent: string;
  instructorsCount: number;
}

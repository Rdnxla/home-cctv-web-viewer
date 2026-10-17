interface User {
  id: number;
  name: string;
  avatar: string;
  clientSince: string;
  sports: string[];
  upcomingSessions: number;
  waitlisted: number;
  totalSpent: string;
  instructorsCount: number;
}

export type {User};

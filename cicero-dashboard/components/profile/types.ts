export interface Stat {
  label: string;
  value: number | string;
}

export interface Activity {
  id: string;
  text: string;
  date: string;
}

export interface ProfileData {
  avatar: string;
  name: string;
  email: string;
  stats: Stat[];
  activity: Activity[];
}

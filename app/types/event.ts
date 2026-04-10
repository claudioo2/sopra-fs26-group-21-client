export interface Event {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  latitude: number;
  longitude: number;
  isPrivate: boolean;
  creatorId: number;
  creatorUsername: string;
  participantCount: number;
  pictureUrls: string[];
  inviteCode: string | null;
}

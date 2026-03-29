export interface EventDTO {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  isPrivate: boolean;
  creatorId: number | null;
  participantCount: number | null;
}
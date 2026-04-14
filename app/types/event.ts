export type EventCategory =
  | "SPORTS"
  | "MUSIC"
  | "FOOD"
  | "ART"
  | "SOCIAL"
  | "OUTDOOR"
  | "PARTY"
  | "OTHER";

export interface EventDTO {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  isPrivate: boolean;
  inviteCode: string | null;
  category: EventCategory | null;
  creatorId: number | null;
  creatorUsername: string | null;
  participantCount: number | null;
  pictureUrls: string[] | null;
  isParticipant?: boolean;
  participantIds?: number[] | null;
}

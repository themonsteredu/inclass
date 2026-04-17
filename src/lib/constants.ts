export const ROLES = ["STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const LECTURE_TYPES = ["TIP", "CONCEPT", "PATTERN"] as const;
export type LectureType = (typeof LECTURE_TYPES)[number];

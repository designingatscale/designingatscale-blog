export interface Series {
  name: string;
  order: number;
}

export interface SeriesPost {
  slug: string;
  title: string;
  order: number;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  tags: string[];
  topic?: string;
  featured?: boolean;
  author?: string;
  series?: Series;
  seriesPosts?: SeriesPost[];
}

export interface Comment {
  _id: string;
  slug: string;
  name: string;
  avatar: string;
  content: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

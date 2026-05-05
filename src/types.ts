export interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bgPic: string;
  bio: string;
  isBot: boolean;
  followingCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface Tweet {
  id: number;
  userId: number;
  content: string;
  image?: string | null;
  createdAt: string;
  likes: number;
  retweets: number;
  views: number;
  bookmarks: number;
  commentsCount: number;
  isLiked: boolean;
  isRetweeted: boolean;
  isBookmarked: boolean;
  user?: User; // added joined user
}

export interface Comment {
  id: number;
  tweetId: number;
  userId: number;
  content: string;
  createdAt: string;
  likes: number;
  user?: User; // added joined user
}


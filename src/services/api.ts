import { Post, Comment } from '../types';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      (body as { error?: string }).error || `Request failed: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}

export function fetchPosts(): Promise<Post[]> {
  return request<Post[]>('/api/posts.json');
}

export function fetchPost(slug: string): Promise<Post> {
  return request<Post>(`/api/posts/${slug}.json`);
}

export function fetchComments(slug: string): Promise<Comment[]> {
  return request<Comment[]>(`/api/posts/${slug}/comments`);
}

export function postComment(
  slug: string,
  content: string,
  credential: string,
  parentId?: string,
): Promise<Comment> {
  return request<Comment>(`/api/posts/${slug}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, credential, parentId }),
  });
}

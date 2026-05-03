export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const clearAuthToken = () => localStorage.removeItem('auth_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok || data.code !== 200) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data.data as T;
}

export const api = {
  auth: {
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  },
  interview: {
    createSession: (body: { jobCategoryId: string | number; difficulty: string; questionCount: number }) => 
      request<any>('/interview/sessions', { method: 'POST', body: JSON.stringify(body) }),
      
    submitAnswer: (questionId: number | string, userAnswer: string) => 
      request<any>(`/interview/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify({ userAnswer }) }),
      
    completeSession: (sessionId: number | string) => 
      request<any>(`/interview/sessions/${sessionId}/complete`, { method: 'POST' }),
      
    getSessionDetail: (sessionId: number | string) => 
      request<any>(`/interview/sessions/${sessionId}`, { method: 'GET' }),
      
    getHistory: (page: number = 1, size: number = 10) => 
      request<any>(`/interview/sessions?page=${page}&size=${size}`, { method: 'GET' }),
      
    streamChatUrl: (sessionId: number | string) => {
      // NOTE: For SSE, you typically use EventSource, but you need to send the token.
      // Often token can be passed in query or you can use fetch for stream.
      return `${API_BASE_URL}/interview/sessions/${sessionId}/chat`;
    }
  },
  user: {
    getCurrentUser: () => request<any>('/users/me', { method: 'GET' }),
  },
  resumes: {
    upload: async (file: File) => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.code !== 200) {
        throw new Error(data.message || 'API request failed');
      }
      return data.data;
    },
    list: () => request<any>('/resumes', { method: 'GET' }),
    optimize: (resumeId: string | number, jobDescription: string) => 
      request<any>(`/resumes/${resumeId}/optimize`, { method: 'POST', body: JSON.stringify({ jobDescription }) }),
    getOptimization: (optId: string | number) => request<any>(`/resumes/optimizations/${optId}`, { method: 'GET' }),
  },
  jobCategories: {
    list: (parentId?: number) => {
      const qs = parentId ? `?parentId=${parentId}` : '';
      return request<any[]>(`/job-categories${qs}`, { method: 'GET' });
    }
  }
};

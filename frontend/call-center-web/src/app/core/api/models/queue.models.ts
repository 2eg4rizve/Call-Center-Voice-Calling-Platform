export interface CallQueueResponse { id: string; name: string; description: string | null; isActive: boolean }
export interface CreateCallQueueRequest { name: string; description: string | null }
export interface UpdateCallQueueRequest { name: string; description: string | null; isActive: boolean }

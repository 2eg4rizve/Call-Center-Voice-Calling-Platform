export interface CustomerResponse { id: string; customerReferenceNumber: string; name: string; emailAddress: string | null; customerCategory: string | null; recentInteractionSummary: string | null; isKnownCustomer: boolean }
export interface CreateCustomerRequest { name: string; phoneNumber: string; emailAddress: string | null; customerCategory: string | null; recentInteractionSummary: string | null }
export interface UpdateCustomerRequest { name: string; emailAddress: string | null; customerCategory: string | null; recentInteractionSummary: string | null }

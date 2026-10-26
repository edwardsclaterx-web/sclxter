export type KnowledgeSource = "note" | "scan";

export type WidgetTheme = {
  outline: string;
  primary: string;
  text: string;
};

export type Appearance = {
  assistantName: string;
  colour: string;
  welcome: string;
  theme: WidgetTheme;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  paidUntil?: string;
  setupPaid?: boolean;
  stripeCustomerId?: string;
  processedCheckoutIds?: string[];
};

export type Business = {
  id: string;
  seq: number;
  ownerId: string | null;
  name: string;
  websiteUrl: string;
  industry: string;
  contactPhone: string;
  contactEmail: string;
  contactOther: string;
  tone: string;
  notepad: string;
  lastScanText: string;
  scannedAt: string | null;
  industryBriefing: string;
  industryBriefingFor: string;
  publicId: string;
  appearance: Appearance;
  widgetConnectedAt: string | null;
  createdAt: string;
};

export type KnowledgeItem = {
  id: string;
  businessId: string;
  source: KnowledgeSource;
  title: string;
  body: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  businessId: string;
  conversationId: string | null;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  businessId: string;
  seq: number;
  messages: ChatMessage[];
  lead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  instructions: string[];
};

export type SupportRole = "owner" | "admin";

export type SupportMessage = {
  id: string;
  from: SupportRole;
  content: string;
  createdAt: string;
};

export type SupportThread = {
  id: string;
  businessId: string;
  ownerId: string;
  messages: SupportMessage[];
  ownerUnread: number;
  adminUnread: number;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeGap = {
  id: string;
  businessId: string;
  key: string;
  question: string;
  count: number;
  createdAt: string;
  updatedAt: string;
};

export type StoreData = {
  users: User[];
  businesses: Business[];
  knowledge: KnowledgeItem[];
  leads: Lead[];
  conversations: Conversation[];
  supportThreads: SupportThread[];
  knowledgeGaps: KnowledgeGap[];
  settings: StoreSettings;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClientBusiness = {
  name: string;
  websiteUrl: string;
  industry: string;
  contactPhone: string;
  contactEmail: string;
  contactOther: string;
  tone: string;
  notepad: string;
  scannedAt: string | null;
  publicId: string;
  createdAt: string;
  theme: WidgetTheme;
  seq?: number;
  ownerEmail?: string;
};

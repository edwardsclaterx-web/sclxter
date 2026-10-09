export type KnowledgeSource = "note" | "scan";

export type Appearance = {
  assistantName: string;
  colour: string;
  welcome: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
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

export type StoreData = {
  users: User[];
  businesses: Business[];
  knowledge: KnowledgeItem[];
  leads: Lead[];
  conversations: Conversation[];
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
  publicId: string;
  createdAt: string;
  seq?: number;
  ownerEmail?: string;
};

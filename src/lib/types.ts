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
  ownerId: string | null;
  name: string;
  websiteUrl: string;
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
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
};

export type StoreData = {
  users: User[];
  businesses: Business[];
  knowledge: KnowledgeItem[];
  leads: Lead[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

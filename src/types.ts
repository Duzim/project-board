export type InboundMessage =
  | { type: 'openProject'; projectId: string }
  | { type: 'addProject' } 
  | { type: 'removeProject'; groupId: string; projectId: string }
  | { type: 'ready' };

export type OutboundMessage =
  | { type: 'projects'; html: string };
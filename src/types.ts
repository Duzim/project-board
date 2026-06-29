export type InboundMessage =
  | { type: 'openProject'; projectId: string }
  | { type: 'addProject' } 
  | { type: 'addGroup' } 
  | { type: 'editColor'; projectId: string; groupId: string }
  | { type: 'editInfo'; projectId: string; groupId: string }
  | { type: 'removeProject'; groupId: string; projectId: string }
  | { type: 'ready' };

export type OutboundMessage =
  | { type: 'projects'; html: string };
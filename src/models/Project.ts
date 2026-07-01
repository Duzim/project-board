export interface Project {
  id: string;
  name: string;
  path: string;
  color?: string;            
  imageBackground?: string; 
}

export function createProject(input: {
    name: string;
    path: string;
    color?: string;            
    imageBackground?: string; 
}) {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    path: input.path,
    color: input.color,
    imageBackground: input.imageBackground,
  };
}

export function withColor(project: Project, color: string): Project {
  return { ...project, color };
}
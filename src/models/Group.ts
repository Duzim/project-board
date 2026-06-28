import { Project } from "./Project";
import {randomUUID} from 'node:crypto';

export interface Group {
  id: string;
  name: string;
  projects: Project[];
}

export function createGroup(input: {
    name: string,
    projects?: Project[]
}): Group {
    return {
        id: randomUUID(),
        name: input.name,
        projects: input.projects ?? []
    } 
}
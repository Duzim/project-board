import * as vscode from 'vscode';
import { Group } from '../models/Group';
import { Project } from '../models/Project';

export default class GroupsStore {
    private static readonly KEY = 'projectBoard.groups';

    constructor(
        private context: vscode.ExtensionContext
    ) {}

    getGroups(): Group[] {
        return this.context.globalState.get<Group[]>(GroupsStore.KEY, []);
    }

    private async saveGroups(groups: Group[]): Promise<void> {
        await this.context.globalState.update(GroupsStore.KEY, groups);
    }

    async addGroup(group: Group): Promise<void> {
        const groups = this.getGroups();
        await this.saveGroups([...groups, group])
    }

    async removeGroup(groupId: string): Promise<void> {
        const groups = this.getGroups().filter(g => g.id !== groupId);
        await this.saveGroups(groups);
    }

    async addProjectToGroup(groupId: string, project: Project): Promise<void> {
        const groups = this.getGroups().map(g => g.id === groupId ? {
            ...g, projects: [...g.projects, project]
        } : g);
        await this.saveGroups(groups);
    }

    async removeProject(groupId: string, projectId: string): Promise<void> {
        const groups = this.getGroups().map(g => g.id === groupId ? {
            ...g, projects: g.projects.filter(p => p.id !== projectId)
        } : g);
        await this.saveGroups(groups);
    }

    async updateProject(groupId: string, project: Project): Promise<void> {
        const groups = this.getGroups().map(g => 
            g.id === groupId
            ? { ...g, projects: g.projects.map(p => p.id === project.id ? project : p ) }
            : g
        );
        await this.saveGroups(groups);
    }

    async renameGroup(groupId: string, name: string): Promise<void> {
        const groups = this.getGroups().map(g =>
            g.id === groupId ? { ...g, name } : g
        );
        await this.saveGroups(groups);
    }
}

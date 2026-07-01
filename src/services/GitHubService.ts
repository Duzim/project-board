import * as vscode from 'vscode';
import { GithubRepo } from '../models/GitHubRepo';

export class GithubService {
    constructor(
        private context: vscode.ExtensionContext
    ) { }

    async getSession(createIfNone = true): Promise<vscode.AuthenticationSession | undefined> {
        return vscode.authentication.getSession('github', ['repo'], {createIfNone});
    }

    async listRepos(): Promise<GithubRepo[]> {
        const session = await this.getSession();
        if (!session) return [];

        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                Accept: 'application/vnd.github+json'
            }
        });

        if (!res.ok) {
            throw new Error();
        }
        
        return res.json() as unknown as GithubRepo[];
    }
}
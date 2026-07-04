import * as vscode from 'vscode';
import * as path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';

export class GitService {
    
    async clone(repoUrl: string, parentDir: string): Promise<string> {
        const repoName = GitService.repoNameFromUrl(repoUrl);
        const targetPath = path.join(parentDir, repoName);

        const git: SimpleGit = simpleGit(parentDir);
        await git.clone(repoUrl, targetPath);

        return targetPath;
    }

    static repoNameFromUrl(url: string): string {
        const last = url.split('/').pop() ?? 'repo';
        return last.replace(/\.git$/, '');
    }
}
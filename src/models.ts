import * as vscode from 'vscode';
import crypto from 'node:crypto'
import {isRgbOrHex} from './utils';

export class Group {
    public id: string;
    constructor( 
        public name: string, 
        public projects: Project[] = []
    ) { 
        this.id = crypto.randomUUID();
    }

}

export class Project {
    id: string;
    private color = "#000";
    isGitRepo = false;
    
    constructor(
        public name: string,
        public path: string,
    ) { 
        this.id = crypto.randomUUID();
    }

    addColor(color: string) {
        if (!isRgbOrHex(color)) return;
        this.color = color;
    }

}



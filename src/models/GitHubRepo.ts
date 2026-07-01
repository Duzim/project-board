export interface GithubRepo {
    name: string;
    full_name: string; // "usuario/repo"
    clone_url: string; // pra o git.clone
    html_url: string;  // link pro GitHub
    private: boolean;
    updated_at: string;
    description: string | null;
}
export type GithubRepoSummary = {
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  updatedAt: string;
  description: string | null;
  language: string | null;
  ownerLogin: string;
};

export type GithubOrgSummary = {
  login: string;
  avatarUrl: string;
  description: string | null;
  repos: GithubRepoSummary[];
};

export type GithubProfileRecord = {
  username: string;
  avatarUrl: string;
  /** Repos you own (personal). */
  personalRepos: GithubRepoSummary[];
  /** Repos you collaborate on (not owner). */
  collaboratorRepos: GithubRepoSummary[];
  /** Orgs + their repos you can access. */
  organizations: GithubOrgSummary[];
  /** Convenience totals for badges. */
  totals: {
    personal: number;
    collaborator: number;
    organization: number;
  };
};

export type GithubAuthRecord = {
  isConnected: boolean;
  role: string;
};

export type GithubResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

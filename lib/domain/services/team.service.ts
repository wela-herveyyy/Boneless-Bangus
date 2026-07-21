import type {
  CreateTeamInput,
  TeamListItem,
  TeamResult,
  TeamSelect,
  UpdateTeamApiKeysInput,
} from "@/lib/entities/team.type";
import { createTeam as createTeamUseCase } from "../usecases/team/create_team.usecase";
import { listTeams as listTeamsUseCase } from "../usecases/team/list_teams.usecase";
import { updateTeamApiKeys as updateTeamApiKeysUseCase } from "../usecases/team/update_team_api_keys.usecase";
import { getManagedTeamId as getManagedTeamIdUseCase } from "../usecases/team/get_managed_team_id.usecase";

export async function listTeams(): Promise<TeamResult<TeamListItem[]>> {
  return listTeamsUseCase();
}

export async function createTeam(input: CreateTeamInput): Promise<TeamResult<TeamSelect>> {
  return createTeamUseCase(input);
}

export async function updateTeamApiKeys(
  input: UpdateTeamApiKeysInput,
): Promise<TeamResult<{ id: string }>> {
  return updateTeamApiKeysUseCase(input);
}

export async function getManagedTeamId(userId: string): Promise<TeamResult<string | null>> {
  return getManagedTeamIdUseCase(userId);
}

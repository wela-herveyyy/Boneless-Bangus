import type {
  CreateTeamInput,
  TeamDetail,
  TeamListItem,
  TeamResult,
  TeamSelect,
  UpdateTeamApiKeysInput,
} from "@/lib/entities/team.type";
import {
  changeTeamLeader as changeTeamLeaderUseCase,
  type ChangeTeamLeaderInput,
} from "../usecases/team/change_team_leader.usecase";
import { createTeam as createTeamUseCase } from "../usecases/team/create_team.usecase";
import { getTeamDetail as getTeamDetailUseCase } from "../usecases/team/get_team_detail.usecase";
import { listTeams as listTeamsUseCase } from "../usecases/team/list_teams.usecase";
import {
  removeTeamMember as removeTeamMemberUseCase,
  type RemoveTeamMemberInput,
} from "../usecases/team/remove_team_member.usecase";
import { updateTeamApiKeys as updateTeamApiKeysUseCase } from "../usecases/team/update_team_api_keys.usecase";
import { getManagedTeamId as getManagedTeamIdUseCase } from "../usecases/team/get_managed_team_id.usecase";

export async function listTeams(): Promise<TeamResult<TeamListItem[]>> {
  return listTeamsUseCase();
}

export async function getTeamDetail(teamId: string): Promise<TeamResult<TeamDetail>> {
  return getTeamDetailUseCase(teamId);
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

export async function removeTeamMember(
  input: RemoveTeamMemberInput,
): Promise<TeamResult<{ teamId: string; userId: string }>> {
  return removeTeamMemberUseCase(input);
}

export async function changeTeamLeader(
  input: ChangeTeamLeaderInput,
): Promise<TeamResult<{ teamId: string; managerId: string }>> {
  return changeTeamLeaderUseCase(input);
}

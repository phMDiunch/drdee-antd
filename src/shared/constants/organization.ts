import { ORGANIZATIONAL_STRUCTURE } from "@/data/organizationalStructure";

type OrgNode = (typeof ORGANIZATIONAL_STRUCTURE)[number];

function uniqueValues(selector: (node: OrgNode) => string | null | undefined) {
  const set = new Set<string>();
  ORGANIZATIONAL_STRUCTURE.forEach((node) => {
    const value = selector(node);
    if (value && value.trim().length > 0) {
      set.add(value.trim());
    }
  });
  return set;
}

export const ORG_DEPARTMENTS = uniqueValues((node) => node.department);
export const ORG_TEAMS = uniqueValues((node) => node.team);
export const ORG_JOB_TITLES = uniqueValues((node) => node.jobTitle);
export const ORG_POSITION_TITLES = uniqueValues(
  (node) => node.positionTitle
);

export const isValidDepartment = (value: string) => ORG_DEPARTMENTS.has(value);
export const isValidTeam = (value: string) => ORG_TEAMS.has(value);
export const isValidJobTitle = (value: string) => ORG_JOB_TITLES.has(value);
export const isValidPositionTitle = (value: string) =>
  ORG_POSITION_TITLES.has(value);

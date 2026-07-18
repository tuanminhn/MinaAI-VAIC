from __future__ import annotations

import uuid
from collections import defaultdict

from app.db.models.skill import Skill
from app.db.models.skill_prerequisite import SkillPrerequisite


class SkillGraphService:
    def build_prerequisite_map(
        self,
        *,
        skills: list[Skill],
        edges: list[SkillPrerequisite],
    ) -> dict[uuid.UUID, list[uuid.UUID]]:
        package_skill_ids = {skill.id for skill in skills}
        prerequisite_map: dict[uuid.UUID, list[uuid.UUID]] = {skill.id: [] for skill in skills}

        for edge in sorted(
            edges, key=lambda item: (item.priority, str(item.prerequisite_skill_id))
        ):
            if (
                edge.skill_id not in package_skill_ids
                or edge.prerequisite_skill_id not in package_skill_ids
            ):
                raise RuntimeError("Skill prerequisite edge crosses content package boundaries.")
            prerequisite_map[edge.skill_id].append(edge.prerequisite_skill_id)

        return prerequisite_map

    def ensure_acyclic(
        self,
        *,
        skills: list[Skill],
        edges: list[SkillPrerequisite],
    ) -> None:
        prerequisite_map = self.build_prerequisite_map(skills=skills, edges=edges)
        visiting: set[uuid.UUID] = set()
        visited: set[uuid.UUID] = set()

        def visit(skill_id: uuid.UUID) -> None:
            if skill_id in visited:
                return
            if skill_id in visiting:
                raise RuntimeError("Skill graph contains a cycle.")

            visiting.add(skill_id)
            for prerequisite_id in prerequisite_map[skill_id]:
                visit(prerequisite_id)
            visiting.remove(skill_id)
            visited.add(skill_id)

        for skill in skills:
            visit(skill.id)

    def get_prerequisite_chain(
        self,
        *,
        target_skill_id: uuid.UUID,
        skills: list[Skill],
        edges: list[SkillPrerequisite],
    ) -> list[uuid.UUID]:
        seen: set[uuid.UUID] = set()
        prerequisite_map = self.build_prerequisite_map(skills=skills, edges=edges)
        ordered_skills = self.topological_sort(skills=skills, edges=edges)

        def collect(skill_id: uuid.UUID) -> None:
            for prerequisite_id in prerequisite_map.get(skill_id, []):
                if prerequisite_id in seen:
                    continue
                collect(prerequisite_id)
                seen.add(prerequisite_id)

        collect(target_skill_id)
        return [skill.id for skill in ordered_skills if skill.id in seen]

    def topological_sort(
        self, *, skills: list[Skill], edges: list[SkillPrerequisite]
    ) -> list[Skill]:
        self.ensure_acyclic(skills=skills, edges=edges)
        prerequisite_map = self.build_prerequisite_map(skills=skills, edges=edges)
        dependents: dict[uuid.UUID, list[uuid.UUID]] = defaultdict(list)
        indegree: dict[uuid.UUID, int] = {skill.id: 0 for skill in skills}
        skill_lookup = {skill.id: skill for skill in skills}

        for skill_id, prerequisite_ids in prerequisite_map.items():
            indegree[skill_id] = len(prerequisite_ids)
            for prerequisite_id in prerequisite_ids:
                dependents[prerequisite_id].append(skill_id)

        ready = sorted(
            [skill for skill in skills if indegree[skill.id] == 0],
            key=lambda skill: (skill.sort_order, skill.code),
        )
        ordered: list[Skill] = []

        while ready:
            skill = ready.pop(0)
            ordered.append(skill)
            for dependent_id in sorted(
                dependents.get(skill.id, []), key=lambda item: skill_lookup[item].code
            ):
                indegree[dependent_id] -= 1
                if indegree[dependent_id] == 0:
                    ready.append(skill_lookup[dependent_id])
                    ready.sort(key=lambda item: (item.sort_order, item.code))

        if len(ordered) != len(skills):
            raise RuntimeError("Skill graph contains a cycle.")

        return ordered

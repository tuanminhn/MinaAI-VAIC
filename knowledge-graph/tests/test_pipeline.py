from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import tempfile
import unittest

from mina_kg.data_builder import build_dataset, write_dataset
from mina_kg.validation import ValidationError, validate_dataset


class DatasetTests(unittest.TestCase):
    def test_curated_dataset_is_valid(self) -> None:
        report = validate_dataset(build_dataset())
        self.assertTrue(report["valid"])
        self.assertEqual(report["counts"]["skills"], 11)
        self.assertEqual(report["counts"]["demo_students"], 3)

    def test_writer_creates_backend_ready_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_dataset(root)
            expected = {
                "knowledge_graph.json",
                "misconceptions.json",
                "questions.json",
                "remediation_paths.json",
                "demo_students.json",
            }
            self.assertEqual(expected, {path.name for path in (root / "output").glob("*.json")})

    def test_cycle_is_rejected(self) -> None:
        dataset = deepcopy(build_dataset())
        dataset["edges"].append(
            {
                "source_skill_id": "MATH.G7.RATIONAL.ADD_SUBTRACT",
                "target_skill_id": "MATH.G6.FRACTION.REPRESENT",
                "relationship_type": "prerequisite",
                "evidence": "Intentional test cycle",
                "confidence": 1.0,
                "created_by": "test",
                "review_status": "pending",
            }
        )
        with self.assertRaisesRegex(ValidationError, "cycle"):
            validate_dataset(dataset)

    def test_out_of_scope_grade_is_rejected(self) -> None:
        dataset = deepcopy(build_dataset())
        dataset["skills"][0]["grade"] = 8
        with self.assertRaisesRegex(ValidationError, "outside scope"):
            validate_dataset(dataset)

    def test_broken_misconception_reference_is_rejected(self) -> None:
        dataset = deepcopy(build_dataset())
        dataset["questions"][0]["options"][1]["misconception_id"] = "MIS.UNKNOWN"
        with self.assertRaisesRegex(ValidationError, "broken option misconception"):
            validate_dataset(dataset)


if __name__ == "__main__":
    unittest.main()


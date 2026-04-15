import re
import json
import uuid
from pathlib import Path

from app.core.config import get_settings


class IEEEComplianceAgent:
    def __init__(self):
        settings = get_settings()
        with open(settings.rules_path, "r") as f:
            self.rules = json.load(f)

    def check_compliance(self, document: str) -> list[dict]:
        violations = []
        violations.extend(self._check_required_sections(document))
        violations.extend(self._check_section_order(document))
        violations.extend(self._check_abstract(document))
        violations.extend(self._check_citations(document))
        violations.extend(self._check_section_numbering(document))
        return violations

    def _extract_sections(self, document: str) -> list[dict]:
        """
        Extract section headings from plain text.
        Handles formats:
          - "1. Introduction"
          - "Abstract"
          - "I. Introduction" (Roman numerals)
          - "References"
        Lexical getTextContent() outputs headings as plain text lines.
        """
        patterns = [
            # Numbered: "1. Introduction", "2. Related Work"
            re.compile(
                r"^(\d+)\.\s+([A-Za-z][A-Za-z\s&]+)$", re.MULTILINE
            ),
            # Roman numeral: "I. Introduction", "IV. Results"
            re.compile(
                r"^([IVXivx]+)\.\s+([A-Za-z][A-Za-z\s&]+)$", re.MULTILINE
            ),
            # Unnumbered standalone heading (for Abstract, References, etc.)
            re.compile(
                r"^(Abstract|References|Bibliography)$",
                re.MULTILINE | re.IGNORECASE,
            ),
        ]

        sections = []
        seen_positions = set()

        # Numbered and roman numeral patterns
        for pattern in patterns[:2]:
            for match in pattern.finditer(document):
                pos = match.start()
                if pos in seen_positions:
                    continue
                seen_positions.add(pos)
                name = match.group(2).strip()
                if len(name) > 60:
                    continue
                number_str = match.group(1)
                sections.append(
                    {
                        "name": name,
                        "position": pos,
                        "line": document[:pos].count("\n") + 1,
                        "raw_number": number_str,
                    }
                )

        # Unnumbered pattern
        for match in patterns[2].finditer(document):
            pos = match.start()
            if pos in seen_positions:
                continue
            seen_positions.add(pos)
            name = match.group(0).strip()
            sections.append(
                {
                    "name": name,
                    "position": pos,
                    "line": document[:pos].count("\n") + 1,
                    "raw_number": None,
                }
            )

        # Sort by position
        sections.sort(key=lambda s: s["position"])
        return sections

    def _find_matching_rule(self, section_name: str) -> dict | None:
        normalized = section_name.lower().strip()
        for rule in self.rules["required_sections"]:
            if normalized == rule["name"].lower():
                return rule
            if normalized in [a.lower() for a in rule["aliases"]]:
                return rule
        return None

    def _check_required_sections(self, document: str) -> list[dict]:
        violations = []
        found_sections = self._extract_sections(document)
        found_names = set()

        for sec in found_sections:
            rule = self._find_matching_rule(sec["name"])
            if rule:
                found_names.add(rule["name"])

        for required in self.rules["required_sections"]:
            if required["name"] not in found_names:
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "missing_section",
                        "message": f"Required section '{required['name']}' is missing.",
                        "severity": "error",
                        "location": None,
                    }
                )
        return violations

    def _check_section_order(self, document: str) -> list[dict]:
        violations = []
        found_sections = self._extract_sections(document)
        ordered = []

        for sec in found_sections:
            rule = self._find_matching_rule(sec["name"])
            if rule:
                ordered.append(
                    {
                        "rule": rule,
                        "position": sec["position"],
                        "line": sec["line"],
                    }
                )

        for i in range(len(ordered) - 1):
            current = ordered[i]
            next_sec = ordered[i + 1]
            if current["rule"]["order"] > next_sec["rule"]["order"]:
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "section_order",
                        "message": (
                            f"Section '{next_sec['rule']['name']}' should appear "
                            f"before '{current['rule']['name']}'."
                        ),
                        "severity": "warning",
                        "location": {"line": next_sec["line"]},
                    }
                )
        return violations

    def _check_section_numbering(self, document: str) -> list[dict]:
        """Check that numbered sections use sequential numbering."""
        violations = []
        found_sections = self._extract_sections(document)

        numbered = []
        for sec in found_sections:
            if sec["raw_number"] is not None and sec["raw_number"].isdigit():
                numbered.append(
                    {
                        "number": int(sec["raw_number"]),
                        "name": sec["name"],
                        "line": sec["line"],
                    }
                )

        for i, sec in enumerate(numbered):
            expected = i + 1
            if sec["number"] != expected:
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "section_numbering",
                        "message": (
                            f"Section '{sec['name']}' is numbered {sec['number']} "
                            f"but expected {expected}. Sections should be numbered sequentially."
                        ),
                        "severity": "warning",
                        "location": {"line": sec["line"]},
                    }
                )
        return violations

    def _check_abstract(self, document: str) -> list[dict]:
        violations = []
        found_sections = self._extract_sections(document)
        abstract_section = None
        next_section_pos = len(document)

        for i, sec in enumerate(found_sections):
            rule = self._find_matching_rule(sec["name"])
            if rule and rule["name"] == "Abstract":
                abstract_section = sec
                if i + 1 < len(found_sections):
                    next_section_pos = found_sections[i + 1]["position"]
                break

        if abstract_section:
            abstract_text = document[abstract_section["position"] : next_section_pos]
            # Skip the heading line itself
            lines = abstract_text.split("\n")[1:]
            body = " ".join(lines).strip()
            word_count = len(body.split()) if body else 0
            min_w = self.rules["abstract_rules"]["min_words"]
            max_w = self.rules["abstract_rules"]["max_words"]

            if word_count < min_w:
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "abstract_length",
                        "message": (
                            f"Abstract has {word_count} words. "
                            f"IEEE recommends {min_w}-{max_w} words."
                        ),
                        "severity": "warning",
                        "location": {"line": abstract_section["line"]},
                    }
                )
            elif word_count > max_w:
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "abstract_length",
                        "message": (
                            f"Abstract has {word_count} words. "
                            f"IEEE recommends {min_w}-{max_w} words."
                        ),
                        "severity": "warning",
                        "location": {"line": abstract_section["line"]},
                    }
                )
        return violations

    def _check_citations(self, document: str) -> list[dict]:
        violations = []

        valid_patterns = [re.compile(v["pattern"]) for v in self.rules["citation_patterns"]]

        def _is_valid_ieee_citation(token: str) -> bool:
            return any(p.fullmatch(token) for p in valid_patterns)

        for invalid in self.rules["invalid_citation_patterns"]:
            pattern = re.compile(invalid["pattern"], re.IGNORECASE)
            for match in pattern.finditer(document):
                line_num = document[: match.start()].count("\n") + 1
                violations.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "citation_format",
                        "message": (
                            f"Non-IEEE citation format detected: '{match.group()}'. "
                            f"Use IEEE numeric format [N]."
                        ),
                        "severity": "error",
                        "location": {
                            "line": line_num,
                            "text": match.group(),
                        },
                    }
                )

        has_ieee = False
        for valid in self.rules["citation_patterns"]:
            if re.search(valid["pattern"], document):
                has_ieee = True
                break

        if not has_ieee and len(document.strip()) > 500:
            violations.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "citation_missing",
                    "message": "No IEEE-format citations [N] found in the document.",
                    "severity": "info",
                    "location": None,
                }
            )

        return violations

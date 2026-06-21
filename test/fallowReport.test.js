const assert = require("node:assert/strict");
const test = require("node:test");

const { normalizeFallowReport } = require("../src/fallowReport");

test("normalizes combined Fallow report into compact dashboard state", () => {
  const report = normalizeFallowReport(
    {
      version: "2.91.0",
      elapsed_ms: 25,
      check: {
        total_issues: 1,
        entry_points: { total: 3 },
        summary: { duplicate_exports: 1 },
        duplicate_exports: [
          {
            export_name: "sharedValue",
            locations: [
              { path: "a.js", line: 3 },
              { path: "b.js", line: 7 }
            ]
          }
        ]
      },
      dupes: {
        clone_groups: [],
        stats: {
          clone_groups: 0,
          clone_instances: 0,
          duplicated_lines: 0,
          duplication_percentage: 0
        }
      },
      health: {
        findings: [],
        summary: {
          files_analyzed: 10,
          functions_analyzed: 20,
          functions_above_threshold: 0,
          average_maintainability: 91.5
        },
        vital_signs: {
          avg_cyclomatic: 1.7,
          p90_cyclomatic: 4,
          coupling_high_pct: 2,
          total_loc: 500
        },
        file_scores: [
          {
            path: "a.js",
            maintainability_index: 80,
            total_cyclomatic: 10,
            total_cognitive: 4,
            fan_in: 2,
            fan_out: 3,
            lines: 44
          }
        ],
        targets: [
          {
            path: "a.js",
            priority: 9.2,
            efficiency: 8.5,
            category: "split_high_impact",
            effort: "medium",
            confidence: "medium",
            recommendation: "Split high-impact file"
          }
        ]
      }
    },
    {
      command: "npx fallow --format json --quiet",
      durationMs: 30,
      exitCode: 0,
      generatedAt: "2026-06-21T00:00:00.000Z"
    }
  );

  assert.equal(report.status, "attention");
  assert.equal(report.hardFindings.count, 1);
  assert.equal(report.health.targets.length, 1);
  assert.equal(report.overview.length, 3);
  assert.equal(report.overview[0].label, "Blocking Findings");
  assert.equal(report.overview[0].value, report.hardFindings.count);
  assert.equal(report.overview[1].label, "Refactoring Suggestions");
  assert.equal(report.overview[1].value, report.health.targets.length);
  assert.equal(report.overview[2].label, "Maintainability");
  assert.equal(report.overview[2].tone, "good");
  assert.equal(report.check.entryPointCount, 3);
  assert.equal(report.check.sections[0].id, "duplicate_exports");
  assert.equal(report.check.sections[0].records[0].detail, "a.js:3 | b.js:7");
  assert.equal(report.health.summary.averageMaintainability, 91.5);
  assert.equal(report.health.fileScores[0].path, "a.js");
  assert.equal(report.health.targets[0].effort, "medium");
});

test("marks reports without attention issues as clear", () => {
  const report = normalizeFallowReport({
    version: "2.91.0",
    check: { total_issues: 0, summary: {} },
    dupes: { clone_groups: [], stats: { clone_groups: 0 } },
    health: { findings: [], summary: {}, vital_signs: {}, file_scores: [], targets: [] }
  });

  assert.equal(report.status, "clear");
  assert.equal(report.hardFindings.count, 0);
});

test("combines dead code, duplication, and complexity into hard findings", () => {
  const report = normalizeFallowReport({
    check: {
      total_issues: 4,
      summary: { duplicate_exports: 4 },
      duplicate_exports: [{ export_name: "sharedValue", locations: [] }]
    },
    dupes: {
      clone_groups: [{ id: "clone-1", instances: [] }],
      stats: { clone_groups: 1 }
    },
    health: {
      findings: [{ path: "app.js", severity: "moderate" }],
      summary: {},
      vital_signs: {},
      file_scores: [],
      targets: []
    }
  });

  assert.equal(report.hardFindings.count, 6);
  assert.deepEqual(
    report.hardFindings.sections.map((section) => section.id),
    ["duplicate_exports", "duplicated_code", "complexity_findings"]
  );
  assert.equal(report.status, "attention");
});

test("colors maintainability by score range", () => {
  const reportFor = (averageMaintainability) => normalizeFallowReport({
    check: { total_issues: 0, summary: {} },
    dupes: { clone_groups: [], stats: { clone_groups: 0 } },
    health: {
      findings: [],
      summary: { average_maintainability: averageMaintainability },
      vital_signs: {},
      file_scores: [],
      targets: []
    }
  });

  assert.equal(reportFor(80).overview[2].tone, "good");
  assert.equal(reportFor(60).overview[2].tone, "warn");
  assert.equal(reportFor(59.9).overview[2].tone, "critical");
});

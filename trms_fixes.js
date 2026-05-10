const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageBreak, LevelFormat, Header, Footer
} = require('docx');
const fs = require('fs');

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  navyDark:   "0D2137",
  navyMid:    "1A4A7A",
  navyLight:  "E8F0F8",
  teal:       "0A6B5E",
  tealLight:  "D4EDEA",
  amber:      "8B5E00",
  amberLight: "FFF3CD",
  red:        "7B1C1C",
  redLight:   "FDEAEA",
  green:      "1A5C2E",
  greenLight: "D6F0DE",
  purple:     "4A2080",
  purpleLight:"EEE8FA",
  gray:       "4A4A4A",
  grayLight:  "F4F4F4",
  white:      "FFFFFF",
  black:      "111111",
  codeBg:     "1E2A3A",
  codeText:   "A8D4FF",
};

const b0 = { style: BorderStyle.NONE,   size: 0, color: C.white };
const b1 = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bNone = { top: b0, bottom: b0, left: b0, right: b0 };
const bAll  = { top: b1, bottom: b1, left: b1, right: b1 };

// ── HELPERS ───────────────────────────────────────────────────────────────────
const sp = (b=80,a=80) => ({ before: b, after: a });
const font = "Arial";

function p(runs, spacing = sp()) {
  const children = Array.isArray(runs)
    ? runs.map(r => new TextRun({ font, ...r }))
    : [new TextRun({ font, text: runs, size: 22 })];
  return new Paragraph({ spacing, children });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: sp(520, 180),
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.navyMid, space: 8 } },
    children: [new TextRun({ font, text, size: 36, bold: true, color: C.navyDark })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: sp(400, 140),
    children: [new TextRun({ font, text, size: 28, bold: true, color: C.navyMid })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: sp(320, 100),
    children: [new TextRun({ font, text, size: 24, bold: true, color: C.teal })]
  });
}
function h4(text, color = C.amber) {
  return new Paragraph({
    spacing: sp(240, 80),
    children: [new TextRun({ font, text, size: 22, bold: true, color })]
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: sp(60, 100),
    children: [new TextRun({ font, text, size: 22, color: C.black, ...opts })]
  });
}
function bodyMix(runs) {
  return new Paragraph({
    spacing: sp(60, 100),
    children: runs.map(r => new TextRun({ font, size: 22, color: C.black, ...r }))
  });
}
function gap(sz=120) {
  return new Paragraph({ spacing: sp(sz, 0), children: [new TextRun("")] });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}
function bullet(text, lvl = 0, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: lvl },
    spacing: sp(50, 60),
    children: [new TextRun({ font, text, size: 22, bold, color: C.black })]
  });
}
function subbullet(text) { return bullet(text, 1); }
function numItem(text, lvl = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level: lvl },
    spacing: sp(50, 60),
    children: [new TextRun({ font, text, size: 22, color: C.black })]
  });
}

function cell(text, fill = C.white, bold = false, colW = 4680, color = C.black, size = 20) {
  return new TableCell({
    borders: bAll,
    width: { size: colW, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({
      spacing: sp(0,0),
      children: [new TextRun({ font, text, size, bold, color })]
    })]
  });
}

function banner(title, subtitle, fillColor = C.navyDark) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: bNone,
      shading: { fill: fillColor, type: ShadingType.CLEAR },
      margins: { top: 220, bottom: 220, left: 360, right: 360 },
      children: [
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: sp(0,60),
          children: [new TextRun({ font, text: title, size: 34, bold: true, color: C.white })] }),
        subtitle ? new Paragraph({ alignment: AlignmentType.LEFT, spacing: sp(0,0),
          children: [new TextRun({ font, text: subtitle, size: 20, color: "B0C8E8" })] })
          : new Paragraph({ children: [new TextRun("")] })
      ]
    })])]
  });
}

function callout(label, lines, fillColor = C.navyLight, labelColor = C.navyMid, textColor = C.black) {
  const textChildren = Array.isArray(lines)
    ? lines.map((l, i) => new Paragraph({
        spacing: sp(i === 0 ? 0 : 40, 0),
        children: [new TextRun({ font, text: l, size: 20, color: textColor })]
      }))
    : [new Paragraph({ spacing: sp(0,0), children: [new TextRun({ font, text: lines, size: 20, color: textColor })] })];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1100, 8260],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: bNone,
        width: { size: 1100, type: WidthType.DXA },
        shading: { fill: labelColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 120, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ font, text: label, size: 17, bold: true, color: C.white })]
        })]
      }),
      new TableCell({
        borders: bNone,
        width: { size: 8260, type: WidthType.DXA },
        shading: { fill: fillColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 180, right: 140 },
        children: textChildren
      })
    ]})]
  });
}

function problem(text) { return callout("⚠ PROBLEM",  text, C.redLight,    C.red); }
function fix(text)     { return callout("✓ FIX",      text, C.greenLight,  C.green); }
function verify(text)  { return callout("✔ VERIFY",   text, C.tealLight,   C.teal); }
function warn(text)    { return callout("! CAUTION",  text, C.amberLight,  C.amber); }
function agent(text)   { return callout("⚙ AGENT",   text, C.purpleLight, C.purple); }
function noteBox(text) { return callout("i  NOTE",   text, C.grayLight,   C.gray); }

function codeBlock(lines) {
  const codeLines = Array.isArray(lines) ? lines : [lines];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: bNone,
      shading: { fill: C.codeBg, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 240, right: 240 },
      children: codeLines.map(line => new Paragraph({
        spacing: sp(20, 20),
        children: [new TextRun({ font: "Courier New", text: line, size: 18, color: C.codeText })]
      }))
    })])]
  });
}

function twoColHeader(a, b, w1 = 3200, w2 = 6160) {
  return new TableRow({ children: [
    cell(a, C.navyDark, true, w1, C.white, 19),
    cell(b, C.navyDark, true, w2, C.white, 19),
  ]});
}
function twoColRow(a, b, shade = C.white, w1 = 3200, w2 = 6160) {
  return new TableRow({ children: [
    cell(a, shade, false, w1, C.black, 19),
    cell(b, shade, false, w2, C.black, 19),
  ]});
}
function twoColTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows
  });
}

// ── PROBLEM SECTION FACTORY ───────────────────────────────────────────────────
// Creates a full richly-formatted problem section
function problemSection(opts) {
  // opts: { id, severity, title, contracts, shortDesc, longDesc,
  //         agentSteps, contractCode, testCode, verifyChecks, integrationNotes, cautions }
  const severityColor = { CRITICAL: C.red, SIGNIFICANT: C.amber, STRUCTURAL: C.navyMid }[opts.severity] || C.gray;
  const severityFill  = { CRITICAL: C.redLight, SIGNIFICANT: C.amberLight, STRUCTURAL: C.navyLight }[opts.severity] || C.grayLight;

  const items = [];

  // Problem ID banner
  items.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 6360, 1400],
    rows: [new TableRow({ children: [
      cell(opts.id, C.navyDark, true, 1600, C.white, 22),
      cell(opts.title, C.navyDark, true, 6360, C.white, 22),
      cell(opts.severity, severityColor, true, 1400, C.white, 20),
    ]})]
  }));

  items.push(gap(60));

  // Contracts affected
  items.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: [new TableRow({ children: [
      cell("Contracts Affected", C.grayLight, true, 2000, C.gray, 18),
      cell(opts.contracts, C.grayLight, false, 7360, C.black, 18),
    ]})]
  }));

  items.push(gap(80));

  // Problem description
  items.push(h4("Problem Description", C.red));
  items.push(problem(opts.shortDesc));
  if (opts.longDesc) {
    items.push(gap(60));
    if (Array.isArray(opts.longDesc)) {
      opts.longDesc.forEach(l => items.push(body(l)));
    } else {
      items.push(body(opts.longDesc));
    }
  }

  items.push(gap(100));

  // Agent steps
  items.push(h4("Agent Implementation Steps", C.purple));
  opts.agentSteps.forEach((step, i) => {
    items.push(new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      spacing: sp(60, 40),
      children: [new TextRun({ font, text: step.title, size: 22, bold: true, color: C.navyMid })]
    }));
    if (step.detail) {
      (Array.isArray(step.detail) ? step.detail : [step.detail]).forEach(d =>
        items.push(new Paragraph({
          spacing: sp(20, 40),
          indent: { left: 720 },
          children: [new TextRun({ font, text: d, size: 21, color: C.black })]
        }))
      );
    }
    if (step.code) {
      items.push(gap(40));
      items.push(new Paragraph({ spacing: sp(0,20), indent: { left: 720 },
        children: [new TextRun({ font, text: "Code / config:", size: 19, bold: true, color: C.gray })] }));
      items.push(...step.code.map(line => new Paragraph({
        spacing: sp(12, 12),
        indent: { left: 720 },
        children: [new TextRun({ font: "Courier New", text: line, size: 18, color: C.navyMid })]
      })));
    }
    if (step.check) {
      items.push(new Paragraph({ spacing: sp(20, 0), indent: { left: 720 },
        children: [new TextRun({ font, text: "Checkpoint: ", size: 20, bold: true, color: C.teal }),
                   new TextRun({ font, text: step.check, size: 20, color: C.black })] }));
    }
    items.push(gap(40));
  });

  // Contract code snippets if any
  if (opts.contractCode && opts.contractCode.length > 0) {
    items.push(gap(60));
    items.push(h4("Exact Solidity Implementation", C.navyMid));
    items.push(codeBlock(opts.contractCode));
  }

  // Test code
  if (opts.testCode && opts.testCode.length > 0) {
    items.push(gap(60));
    items.push(h4("Required Test Cases (Foundry)", C.teal));
    items.push(codeBlock(opts.testCode));
  }

  // Verify checklist
  items.push(gap(80));
  items.push(h4("Verification Checklist", C.teal));
  opts.verifyChecks.forEach(vc => items.push(verify(vc)));

  // Integration notes
  if (opts.integrationNotes) {
    items.push(gap(80));
    items.push(h4("Integration & Cross-Contract Dependencies", C.navyMid));
    (Array.isArray(opts.integrationNotes) ? opts.integrationNotes : [opts.integrationNotes])
      .forEach(n => items.push(noteBox(n)));
  }

  // Cautions
  if (opts.cautions) {
    items.push(gap(60));
    items.push(h4("Agent Cautions — Do NOT Do These", C.red));
    (Array.isArray(opts.cautions) ? opts.cautions : [opts.cautions])
      .forEach(c => items.push(warn(c)));
  }

  return items;
}

// ═════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═════════════════════════════════════════════════════════════════════════════
const children = [];

// ── COVER ────────────────────────────────────────────────────────────────────
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
  rows: [new TableRow({ children: [new TableCell({
    borders: bNone,
    shading: { fill: C.navyDark, type: ShadingType.CLEAR },
    margins: { top: 600, bottom: 600, left: 480, right: 480 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(0,100),
        children: [new TextRun({ font, text: "TRMS", size: 120, bold: true, color: C.white })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(0,80),
        children: [new TextRun({ font, text: "Transitional Resource Monetary System", size: 28, color: "90B8D8" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(80,80),
        children: [new TextRun({ font, text: "KNOWN PROBLEMS TO FIX", size: 36, bold: true, color: "FFD060" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(0,60),
        children: [new TextRun({ font, text: "Complete Agent-Swarm Implementation & Remediation Guide", size: 22, color: "A8C4DC" })] }),
      gap(120),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(0,40),
        children: [new TextRun({ font, text: "10 Critical Fixes  ·  Exact Contract Code  ·  Test Suites  ·  Verification Checklists", size: 20, color: "788FA0" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(40,0),
        children: [new TextRun({ font, text: "Prepared: May 2026  ·  Target: AI Coding Agent Swarm", size: 20, color: "788FA0" })] }),
    ]
  })] }) ]
}));

children.push(pb());

// ── MASTER INSTRUCTIONS ───────────────────────────────────────────────────────
children.push(banner(
  "MASTER INSTRUCTIONS FOR THE AGENT SWARM",
  "Read this entire section before touching a single file"
));
children.push(gap(120));
children.push(h2("How to Use This Document"));
children.push(body("This document is the authoritative remediation guide for the TRMS smart contract system. Every problem identified in the systems analysis has been converted into a structured, sequenced, agent-executable repair specification. Each section contains everything one agent or one sub-swarm needs to address a single problem: the exact problem, which files are affected, step-by-step instructions, exact Solidity code to write, test cases to run, and a verification checklist that must pass before the fix is considered complete."));
children.push(gap(80));
children.push(body("The agent swarm must not treat these fixes as independent. Several fixes modify the same contracts. The Integration Dependency Map below shows the correct execution order. Fixes must be applied in the specified sequence. Agents that run in parallel must coordinate on the shared contracts listed in each section's 'Contracts Affected' field."));

children.push(gap(120));
children.push(h2("Agent Swarm Execution Rules — Non-Negotiable"));
children.push(body("The following rules apply to every agent on every fix. Violating any of these will introduce new bugs into a system that is not yet deployed. There are no exceptions."));
children.push(gap(60));

children.push(bullet("RULE 1 — READ BEFORE WRITE: Every agent must read the full current content of every contract it will modify before writing a single line. Never modify from memory or from a previous session's snapshot.", 0, true));
children.push(subbullet("Use: git show HEAD:<filename> to get current state before editing"));
children.push(subbullet("Confirm file hash before and after every modification"));
children.push(gap(40));

children.push(bullet("RULE 2 — ONE FIX PER BRANCH: Each fix listed in this document gets its own git branch. Branch naming: fix/<FIX-ID>-<short-slug>. Example: fix/FIX-01-circular-recycling.", 0, true));
children.push(subbullet("Never combine two fixes in one branch even if they touch the same file"));
children.push(subbullet("Each branch is reviewed and merged independently before the next begins"));
children.push(gap(40));

children.push(bullet("RULE 3 — TESTS BEFORE MERGE: No fix branch may be merged to main until ALL test cases in its Verification Checklist pass. A fix that breaks existing tests is not complete, it is broken.", 0, true));
children.push(subbullet("Run: forge test --match-path test/<ContractName>.t.sol -vvv"));
children.push(subbullet("Run full suite: forge test to confirm no regressions"));
children.push(gap(40));

children.push(bullet("RULE 4 — PRESERVE INTERFACES: When modifying a contract, the external interface (public and external function signatures) must not change unless the fix section explicitly instructs it. Internal changes only, unless stated.", 0, true));
children.push(subbullet("If an interface must change, update ALL callers in the same branch"));
children.push(subbullet("Update the corresponding DApp frontend calls in the same PR"));
children.push(gap(40));

children.push(bullet("RULE 5 — EVENT EMISSION: Every new state change introduced by a fix must emit a corresponding event. No silent state changes. The Graph subgraph indexers depend on events for data integrity.", 0, true));
children.push(subbullet("Name events as: <FixID><ActionName>. Example: Fix01MaterialReused"));
children.push(gap(40));

children.push(bullet("RULE 6 — NO MAGIC NUMBERS: Every numeric constant added by a fix (percentages, time periods, thresholds) must be stored as a named constant or as a DAO-governable parameter in ParameterStore.sol. Never hardcode.", 0, true));
children.push(gap(40));

children.push(bullet("RULE 7 — GAS BUDGET: Every new function must be tested for gas consumption. No single transaction may exceed 500,000 gas. If a fix requires more, it must be decomposed into multiple transactions with intermediate state.", 0, true));
children.push(subbullet("Run: forge test --gas-report after every fix"));
children.push(gap(40));

children.push(bullet("RULE 8 — UPGRADE SAFETY: All contracts use the UUPS upgradeable proxy pattern. Any fix that adds new storage variables must append them to the end of the storage layout. Never insert or reorder storage variables — this corrupts the proxy.", 0, true));
children.push(subbullet("Validate with: forge script scripts/CheckStorageLayout.s.sol before merging"));
children.push(gap(40));

children.push(bullet("RULE 9 — INTEGRATION SIGN-OFF: After all fixes in a severity tier (Critical, then Significant, then Structural) are merged and tested, run the full integration test suite before proceeding to the next tier.", 0, true));
children.push(subbullet("Run: forge test --match-path test/integration/ -vvv"));
children.push(gap(40));

children.push(bullet("RULE 10 — DOCUMENT EVERYTHING: Every agent must add NatSpec comments (@notice, @dev, @param, @return) to every function it writes or modifies. No undocumented code enters the system.", 0, true));

children.push(gap(120));
children.push(h2("Integration Dependency Map — Fix Execution Order"));
children.push(body("Fixes must be applied in this exact sequence. Fixes within the same tier can run in parallel across agents IF they do not share the same contract. Check the 'Contracts Affected' field for each fix before parallelizing."));
children.push(gap(80));

children.push(twoColTable([
  twoColHeader("Order / Fix ID", "Fix Title  →  Contracts Modified"),
  twoColRow("TIER 1 — CRITICAL (run first, sequentially)", "", C.redLight),
  twoColRow("FIX-01", "Circular Recycling Attack  →  MaterialNFT.sol, RecycleCenterRegistry.sol"),
  twoColRow("FIX-02", "Labor Cost Inflation  →  LaborAdvanceVault.sol, CommodityOracle.sol (new: LaborRateOracle.sol)"),
  twoColRow("FIX-03", "12-Month Advance Arbitrage  →  LaborAdvanceVault.sol, ResourceAdvanceVault.sol"),
  twoColRow("TIER 2 — SIGNIFICANT (after Tier 1 complete)", "", C.amberLight),
  twoColRow("FIX-04", "Commodity Peg Divergence  →  CommodityOracle.sol, StabilityModule.sol"),
  twoColRow("FIX-05", "Sybil Recycle Centers  →  RecycleCenterRegistry.sol (new: CenterVerifier.sol)"),
  twoColRow("FIX-06", "Oracle Manipulation  →  CommodityOracle.sol, LaborRateOracle.sol"),
  twoColRow("TIER 3 — STRUCTURAL (after Tier 2 complete)", "", C.navyLight),
  twoColRow("FIX-07", "Bootstrap Deadlock  →  MRTToken.sol, ProtocolTreasury.sol (new: GenesisPool.sol)"),
  twoColRow("FIX-08", "Recycle Center Capture  →  RecycleCenterRegistry.sol, ParameterStore.sol"),
  twoColRow("FIX-09", "Physical Product Boundary Erosion  →  ProductRegistry.sol, ParameterStore.sol"),
  twoColRow("FIX-10", "RBE Transition Undefined  →  ParameterStore.sol (new: TransitionMonitor.sol)"),
]));

children.push(gap(120));
children.push(h2("Repository Structure Expected by These Instructions"));
children.push(body("These instructions assume the following project structure. If your structure differs, update file paths accordingly in each fix section."));
children.push(gap(60));
children.push(codeBlock([
  "trms/",
  "├── src/",
  "│   ├── governance/",
  "│   │   ├── TRMSToken.sol",
  "│   │   └── TRMSDao.sol",
  "│   ├── currency/",
  "│   │   ├── MRTToken.sol",
  "│   │   └── StabilityModule.sol",
  "│   ├── registry/",
  "│   │   ├── RecycleCenterRegistry.sol",
  "│   │   └── ProductRegistry.sol",
  "│   ├── nft/",
  "│   │   └── MaterialNFT.sol",
  "│   ├── vaults/",
  "│   │   ├── LaborAdvanceVault.sol",
  "│   │   └── ResourceAdvanceVault.sol",
  "│   ├── oracle/",
  "│   │   └── CommodityOracle.sol",
  "│   ├── compliance/",
  "│   │   └── ComplianceModule.sol",
  "│   └── shared/",
  "│       └── ParameterStore.sol",
  "├── test/",
  "│   ├── unit/",
  "│   └── integration/",
  "├── script/",
  "│   └── (deploy + migration scripts)",
  "└── foundry.toml",
]));

children.push(pb());

// ═════════════════════════════════════════════════════════════════════════════
// FIX-01
// ═════════════════════════════════════════════════════════════════════════════
children.push(banner("TIER 1 — CRITICAL FIXES", "Must be applied before any other work proceeds", C.red));
children.push(gap(120));

problemSection({
  id: "FIX-01",
  severity: "CRITICAL",
  title: "Circular Recycling Attack",
  contracts: "MaterialNFT.sol, RecycleCenterRegistry.sol",
  shortDesc: "The same physical batch of material can be certified at a Recycle Center, generate MRT, then be purchased with that MRT, brought back to the same (or a different) Center, and certified again. This loop can be repeated indefinitely, printing MRT with no net increase in recyclable material in the economy. No mechanism exists in the current design to prevent re-certification of the same physical material.",
  longDesc: [
    "Example attack: Actor A deposits 1,000kg of copper at Center X. Center X mints a MaterialNFT worth 1,000 MRT. Actor A receives 1,000 MRT. Actor A spends 800 MRT to repurchase the same 1,000kg from the Center's inventory. Actor A brings it back, Center X certifies it again, minting another MaterialNFT worth 1,000 MRT. Net gain: 200 MRT per cycle with no new material entering the economy. After 10 cycles, Actor A has extracted 2,000 MRT from nothing.",
    "This is the single most dangerous exploit in the system. It can inflate MRT supply to any arbitrary amount in a short period, completely destroying the peg. It must be fixed before any other work proceeds."
  ],
  agentSteps: [
    {
      title: "Create the Material Tracking ID (MTID) system in MaterialNFT.sol",
      detail: [
        "Add a bytes32 materialBatchId field to the NFT struct. This ID is a keccak256 hash of: (centerAddress, lotNumber, materialType, massKg, certificationTimestamp, iotDeviceSignature).",
        "Add a mapping(bytes32 => bool) public certifiedBatches to track all IDs that have ever been certified.",
        "Add a mapping(bytes32 => bool) public recycledBatches to track IDs that have completed the recycling lifecycle.",
        "Modify mintMaterial() to: compute the MTID, revert if certifiedBatches[mtid] == true (already certified), set certifiedBatches[mtid] = true, store mtid in the NFT struct.",
        "Modify burnOnRecycle() to: set recycledBatches[mtid] = true, then delete certifiedBatches[mtid] — this allows the recycled raw material (now a genuinely NEW batch) to be re-certified under a new MTID, but only after going through the full recycling process."
      ],
      code: [
        "// In MaterialNFT.sol",
        "struct MaterialData {",
        "  bytes32   materialType;",
        "  uint256   massGrams;       // grams, no decimals",
        "  uint8     recyclablePct;",
        "  uint256   recyclingCostMRT;",
        "  address   recycleCenterId;",
        "  bytes32   productSKU;",
        "  bytes32   materialBatchId; // MTID",
        "  bytes32   iotDeviceSig;    // hardware-signed attestation",
        "}",
        "",
        "mapping(bytes32 => bool) public certifiedBatches;",
        "mapping(bytes32 => bool) public recycledBatches;",
        "",
        "function _computeMTID(MaterialData calldata d) internal view returns (bytes32) {",
        "  return keccak256(abi.encodePacked(",
        "    d.recycleCenterId, d.materialType, d.massGrams,",
        "    d.recyclablePct, d.iotDeviceSig, block.chainid",
        "  ));",
        "}",
        "",
        "function mintMaterial(address owner, MaterialData calldata d)",
        "  external onlyRole(CENTER_ROLE) returns (uint256 tokenId) {",
        "  bytes32 mtid = _computeMTID(d);",
        "  require(!certifiedBatches[mtid], 'MTID: batch already certified');",
        "  certifiedBatches[mtid] = true;",
        "  // ... rest of mint logic",
        "}",
      ],
      check: "Attempting to mint two NFTs with identical MTID must revert with 'MTID: batch already certified'."
    },
    {
      title: "Add IoT Device Signature Verification to RecycleCenterRegistry.sol",
      detail: [
        "Each registered Recycle Center must register a hardware IoT device public key (ECDSA secp256k1) in the Registry.",
        "Add mapping(address => address) public centerIoTDevice — maps center address to its IoT device signing address.",
        "Add function registerIoTDevice(address device) external — callable only by the center operator.",
        "In MaterialNFT.mintMaterial(), call RecycleCenterRegistry.verifyIoTSignature(centerId, mtidPreimage, iotDeviceSig) before proceeding. This function recovers the signer from the signature and checks it matches the registered device.",
        "The preimage signed by the IoT device must include: the MTID preimage components + a server-side nonce that expires after 5 minutes. Expired nonces revert."
      ],
      code: [
        "// In RecycleCenterRegistry.sol",
        "mapping(address => address) public centerIoTDevice;",
        "mapping(bytes32 => bool)    public usedNonces;",
        "",
        "function verifyIoTSignature(",
        "  address center, bytes32 msgHash, bytes calldata sig",
        ") external view returns (bool) {",
        "  address signer = ECDSA.recover(msgHash, sig);",
        "  require(signer == centerIoTDevice[center], 'IoT: invalid device sig');",
        "  return true;",
        "}",
      ],
      check: "Certification attempt with a signature from an unregistered device must revert."
    },
    {
      title: "Add the Lot Number Ledger to RecycleCenterRegistry.sol",
      detail: [
        "Each Recycle Center maintains an on-chain lot ledger: mapping(address => mapping(uint256 => bool)) public lotNumbers.",
        "When a Center certifies a batch, it must provide a unique monotonically-increasing lot number. The contract enforces uniqueness.",
        "Lot numbers are part of the MTID preimage, making it impossible to re-use a lot number to generate a different MTID for the same physical batch.",
        "Centers cannot skip lot numbers by more than 100 (prevents pre-generating future MTIDs offline)."
      ],
      check: "Re-submitting the same lot number from the same center must revert."
    },
    {
      title: "Write and run unit tests",
      detail: [
        "Create test/unit/MaterialNFT.t.sol if it does not exist.",
        "Add all tests from the Verification Checklist below.",
        "All tests must pass before this branch is merged."
      ],
      check: "forge test --match-path test/unit/MaterialNFT.t.sol -vvv shows all green."
    }
  ],
  testCode: [
    "// test/unit/MaterialNFT.t.sol",
    "function test_circularAttackPrevented() public {",
    "  MaterialData memory d = _makeMaterialData(CENTER_A, 1000_000, 'COPPER');",
    "  uint256 nft1 = materialNFT.mintMaterial(alice, d);",
    "  // Second mint with same MTID must revert",
    "  vm.expectRevert('MTID: batch already certified');",
    "  materialNFT.mintMaterial(alice, d);",
    "}",
    "",
    "function test_recycleAllowsReMint() public {",
    "  MaterialData memory d = _makeMaterialData(CENTER_A, 1000_000, 'COPPER');",
    "  uint256 nft1 = materialNFT.mintMaterial(alice, d);",
    "  // Recycle the NFT",
    "  materialNFT.burnOnRecycle(nft1);",
    "  // A genuinely NEW batch (different iotDeviceSig + lot) can now be certified",
    "  MaterialData memory d2 = _makeMaterialDifferentLot(CENTER_A, 1000_000, 'COPPER');",
    "  uint256 nft2 = materialNFT.mintMaterial(alice, d2); // must succeed",
    "  assertGt(nft2, nft1);",
    "}",
    "",
    "function test_invalidIoTSigReverts() public {",
    "  MaterialData memory d = _makeMaterialDataBadSig(CENTER_A, 1000_000, 'COPPER');",
    "  vm.expectRevert('IoT: invalid device sig');",
    "  materialNFT.mintMaterial(alice, d);",
    "}",
  ],
  verifyChecks: [
    "Minting two NFTs with identical MTID in the same block reverts on the second call.",
    "Minting two NFTs with identical MTID in different blocks (simulated with vm.warp) still reverts.",
    "After burnOnRecycle(), the certifiedBatches mapping for that MTID returns false.",
    "After burnOnRecycle(), recycledBatches[mtid] returns true.",
    "A new batch with a different lot number from the same center succeeds after recycling.",
    "IoT signature from wrong device key always reverts.",
    "Expired nonce (> 5 minutes old) always reverts.",
    "gas report: mintMaterial() uses fewer than 200,000 gas.",
    "forge test full suite shows zero regressions.",
  ],
  integrationNotes: [
    "RecycleCenterRegistry.verifyIoTSignature() is called inside MaterialNFT.mintMaterial(). RecycleCenterRegistry must be deployed and its address set in MaterialNFT before testing.",
    "The DApp Recycle Center Portal must be updated to: (a) generate the MTID preimage locally, (b) request the IoT device to sign it via the local edge device API, (c) include the sig in the mintMaterial() transaction calldata.",
    "The Graph subgraph must index the new MaterialCertified(bytes32 indexed mtid, address center, uint256 tokenId) event."
  ],
  cautions: [
    "Do NOT delete the certifiedBatches entry when a product is sold or transferred. It must remain true for the lifetime of the NFT. Only burnOnRecycle() should clear it.",
    "Do NOT use block.timestamp alone in the MTID preimage — it is miner-manipulable within ~12 seconds. The iotDeviceSig nonce provides the uniqueness guarantee.",
    "Do NOT make centerIoTDevice publicly writable by anyone except the registered center operator. Access control must be enforced."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-02 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-02",
  severity: "CRITICAL",
  title: "Labor Cost Inflation — No Market-Rate Verification",
  contracts: "LaborAdvanceVault.sol, CommodityOracle.sol, NEW: LaborRateOracle.sol",
  shortDesc: "Producers declare their own labor costs when requesting a 50% advance. There is no mechanism to verify whether the declared amount is reasonable. A producer can declare $10,000 in labor for work that costs $500, receive a $5,000 MRT advance, and after repaying only the actual $500 worth of real cost, extract $4,500 of effectively unbacked MRT. At scale this inflates the MRT supply without corresponding real value.",
  longDesc: [
    "This attack is subtle because it does not require any technical exploit — it only requires dishonest self-reporting, which is trivially easy. The fix must introduce an external market-rate anchor that caps the advance at a verifiable ceiling, without requiring a bureaucratic approval process that would slow down legitimate producers."
  ],
  agentSteps: [
    {
      title: "Create src/oracle/LaborRateOracle.sol (new file)",
      detail: [
        "This oracle aggregates regional median wage rates by occupation category, sourced from ILO (International Labour Organization) data, updated monthly via a DAO-operated keeper.",
        "The oracle stores: mapping(bytes32 => mapping(uint16 => uint256)) public ratePerHourMRT — keyed by (occupationCode, countryCode) returning MRT per hour of labor.",
        "Occupation codes must match a fixed, DAO-approved taxonomy stored in ParameterStore.sol. Initially: MANUFACTURING_GENERAL=0x0001, MANUFACTURING_SKILLED=0x0002, ENGINEERING=0x0003, QUALITY_CONTROL=0x0004, LOGISTICS=0x0005.",
        "Add: uint256 public lastUpdated — timestamp of last oracle update. If older than 45 days, the oracle is considered stale and LaborAdvanceVault will reject all new advances until updated.",
        "Add: function setRates(bytes32[] calldata codes, uint16[] calldata countries, uint256[] calldata rates) external onlyRole(ORACLE_UPDATER_ROLE) — batch update function."
      ],
      code: [
        "// src/oracle/LaborRateOracle.sol",
        "contract LaborRateOracle {",
        "  bytes32 public constant ORACLE_UPDATER_ROLE = keccak256('ORACLE_UPDATER_ROLE');",
        "  uint256 public constant MAX_STALE_PERIOD = 45 days;",
        "  uint256 public constant RATE_CEILING_MULTIPLIER = 150; // 150% of median",
        "",
        "  mapping(bytes32 => mapping(uint16 => uint256)) public ratePerHourMRT;",
        "  uint256 public lastUpdated;",
        "",
        "  function getMaxLaborCost(",
        "    bytes32 occupationCode,",
        "    uint16  countryCode,",
        "    uint32  hoursWorked",
        "  ) external view returns (uint256 maxCostMRT) {",
        "    require(block.timestamp - lastUpdated < MAX_STALE_PERIOD, 'Oracle: stale');",
        "    uint256 medianRate = ratePerHourMRT[occupationCode][countryCode];",
        "    require(medianRate > 0, 'Oracle: no rate for this occupation/country');",
        "    // Cap at 150% of median to allow for above-average wages",
        "    return (medianRate * hoursWorked * RATE_CEILING_MULTIPLIER) / 100;",
        "  }",
        "}",
      ],
      check: "getMaxLaborCost() with an unknown occupation code reverts. With a known code, returns a non-zero value."
    },
    {
      title: "Modify LaborAdvanceVault.requestAdvance() to validate against LaborRateOracle",
      detail: [
        "Add three new required fields to the advance request: occupationCode (bytes32), countryCode (uint16), hoursWorked (uint32).",
        "Before minting any MRT, call laborRateOracle.getMaxLaborCost(occupationCode, countryCode, hoursWorked).",
        "If declaredLaborCost > maxAllowedCost, revert with 'Vault: declared labor exceeds regional ceiling'.",
        "Store occupationCode and countryCode in the AdvanceRecord struct for audit trail.",
        "Emit event: LaborCostValidated(advanceId, occupationCode, countryCode, hoursWorked, declaredCost, maxAllowedCost)."
      ],
      code: [
        "// In LaborAdvanceVault.sol — requestAdvance()",
        "function requestAdvance(",
        "  bytes32 sku,",
        "  uint256 declaredLaborCostMRT,",
        "  uint256 nftId,",
        "  bytes32 occupationCode,",
        "  uint16  countryCode,",
        "  uint32  hoursWorked",
        ") external returns (uint256 advanceId) {",
        "  // 1. Validate against oracle ceiling",
        "  uint256 maxCost = laborRateOracle.getMaxLaborCost(",
        "    occupationCode, countryCode, hoursWorked",
        "  );",
        "  require(declaredLaborCostMRT <= maxCost,",
        "    'Vault: declared labor exceeds regional ceiling');",
        "",
        "  // 2. Standard checks (AUR, NFT validity, etc.)",
        "  _checkAUR();",
        "  _validateNFT(nftId, msg.sender);",
        "",
        "  // 3. Mint 50% as advance",
        "  uint256 advanceAmt = declaredLaborCostMRT / 2;",
        "  mrt.mint(msg.sender, advanceAmt);",
        "  // ... rest of logic",
        "}",
      ],
      check: "Requesting an advance with declared cost 151% of oracle ceiling reverts."
    },
    {
      title: "Add oracle address and role management to ParameterStore.sol",
      detail: [
        "Add address public laborRateOracleAddress to ParameterStore.",
        "Add function setLaborRateOracle(address oracle) external onlyDAO — only changeable by DAO governance vote.",
        "LaborAdvanceVault reads the oracle address from ParameterStore on every call (not cached in storage) so the DAO can upgrade the oracle without upgrading the Vault."
      ],
      check: "After DAO changes the oracle address in ParameterStore, the Vault immediately uses the new oracle on the next requestAdvance() call."
    },
    {
      title: "Write and run unit tests for FIX-02",
      detail: [
        "Create test/unit/LaborRateOracle.t.sol and test/unit/LaborAdvanceVault_RateCheck.t.sol.",
        "Run all tests and confirm all pass."
      ],
      check: "forge test --match-path 'test/unit/LaborRate*' -vvv all green."
    }
  ],
  testCode: [
    "// test/unit/LaborAdvanceVault_RateCheck.t.sol",
    "function test_inflatedLaborReverts() public {",
    "  // Oracle says max is 1000 MRT for these params",
    "  oracle.setRates([OCC_GENERAL], [COUNTRY_US], [10e18]); // 10 MRT/hr",
    "  // Producer claims 5000 MRT for 50 hours (= 100 MRT/hr — far above ceiling)",
    "  vm.expectRevert('Vault: declared labor exceeds regional ceiling');",
    "  vault.requestAdvance(SKU_A, 5000e18, nftId, OCC_GENERAL, COUNTRY_US, 50);",
    "}",
    "",
    "function test_validLaborSucceeds() public {",
    "  oracle.setRates([OCC_GENERAL], [COUNTRY_US], [10e18]); // 10 MRT/hr",
    "  // 50 hours * 10 MRT * 1.5 ceiling = 750 MRT max. Claim 600 — valid",
    "  uint256 advId = vault.requestAdvance(",
    "    SKU_A, 600e18, nftId, OCC_GENERAL, COUNTRY_US, 50",
    "  );",
    "  assertGt(advId, 0);",
    "}",
    "",
    "function test_staleOracleReverts() public {",
    "  vm.warp(block.timestamp + 46 days); // Oracle becomes stale",
    "  vm.expectRevert('Oracle: stale');",
    "  vault.requestAdvance(SKU_A, 100e18, nftId, OCC_GENERAL, COUNTRY_US, 10);",
    "}",
  ],
  verifyChecks: [
    "LaborRateOracle deployed and address registered in ParameterStore.",
    "Declared labor cost at exactly 150% of oracle rate succeeds (boundary case).",
    "Declared labor cost at 151% of oracle rate reverts.",
    "Oracle stale after 45 days — all advances revert until rates updated.",
    "DAO can change oracle address via governance and Vault immediately uses new oracle.",
    "LaborCostValidated event emitted with correct parameters on every successful advance.",
    "forge test full suite shows zero regressions.",
  ],
  integrationNotes: [
    "LaborRateOracle.sol is a NEW file. It must be deployed and its address registered in ParameterStore before LaborAdvanceVault is modified. Ensure deployment script deploys in this order.",
    "The DAO oracle updater (keeper) must be scheduled to run monthly. Set up a Chainlink Automation (formerly Keepers) job or equivalent cron to call setRates() with fresh ILO data.",
    "The Producer Dashboard DApp must be updated to: (a) display the current oracle rate for the selected occupation/country, (b) show the maximum allowed labor cost before the user submits."
  ],
  cautions: [
    "Do NOT set the RATE_CEILING_MULTIPLIER below 120. Legitimate above-average-wage workshops exist in every country and must not be excluded from the system.",
    "Do NOT allow LaborAdvanceVault to cache the oracle address locally in storage. Always read from ParameterStore so oracle upgrades take effect immediately.",
    "Do NOT make the oracle stale-check optional or bypassable by any role, including ADMIN. A stale oracle means the rate ceiling is unknown, which means the system cannot safely issue advances."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-03 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-03",
  severity: "CRITICAL",
  title: "12-Month Advance Arbitrage — Zero-Interest Loan Exploit",
  contracts: "LaborAdvanceVault.sol, ResourceAdvanceVault.sol",
  shortDesc: "Labor and resource advances are currently zero-interest, 12-month loans denominated in MRT. In a functioning DeFi ecosystem, MRT will be deposited into yield protocols (Aave-style lending markets) earning 5-15% APY. A sophisticated actor receives a large advance, earns yield for 12 months, repays only the principal, and keeps the yield. They extracted free money from the system without producing anything, and the MRT supply was inflated for a full year with no productive backing.",
  longDesc: [
    "The fix is to charge interest on advances from day one, at a DAO-set rate. Critically, this interest is burned on repayment — it does not enrich any party. It simply ensures that the cost of capital discourages pure arbitrage while being low enough not to burden genuine producers. Early repayment earns a rebate to incentivize fast repayment and rapid money supply contraction."
  ],
  agentSteps: [
    {
      title: "Add interest accrual to AdvanceRecord struct in both Vault contracts",
      detail: [
        "Add: uint256 interestRateBPS — basis points per year (1 BPS = 0.01%). Initial value: 300 BPS = 3% APY. Read from ParameterStore on advance creation.",
        "Add: uint256 startTimestamp — block.timestamp at advance creation.",
        "Add: uint256 principalMRT — the original advance amount.",
        "The total owed at any time T is: principal + principal * rate * (T - startTimestamp) / (365 days * 10000).",
        "Add a public view function: function getAmountOwed(uint256 advanceId) external view returns (uint256 principal, uint256 interest, uint256 total)."
      ],
      code: [
        "// In LaborAdvanceVault.sol",
        "struct AdvanceRecord {",
        "  address  producer;",
        "  uint256  principalMRT;",
        "  uint256  startTimestamp;",
        "  uint256  interestRateBPS;  // from ParameterStore at creation time",
        "  uint256  dueTimestamp;     // startTimestamp + 365 days",
        "  uint256  collateralNFTId;",
        "  bytes32  productSKU;",
        "  bool     repaid;",
        "}",
        "",
        "function getAmountOwed(uint256 advId)",
        "  public view returns (uint256 principal, uint256 interest, uint256 total) {",
        "  AdvanceRecord memory a = advances[advId];",
        "  require(!a.repaid, 'Vault: already repaid');",
        "  uint256 elapsed = block.timestamp - a.startTimestamp;",
        "  interest = (a.principalMRT * a.interestRateBPS * elapsed)",
        "    / (365 days * 10_000);",
        "  principal = a.principalMRT;",
        "  total = principal + interest;",
        "}",
      ],
      check: "getAmountOwed() for a new advance returns interest of 0. After vm.warp(180 days), returns approximately 1.5% of principal."
    },
    {
      title: "Modify repayAdvance() to collect and burn interest in addition to principal",
      detail: [
        "The caller must approve (principal + interest) MRT before calling repayAdvance().",
        "The vault burns the FULL amount (principal + interest) — not just the principal.",
        "This is critical: interest must be burned, not sent to any address. It is a deflationary mechanism.",
        "Emit event: AdvanceRepaid(advanceId, producer, principal, interest, timestamp)."
      ],
      code: [
        "function repayAdvance(uint256 advId) external nonReentrant {",
        "  AdvanceRecord storage a = advances[advId];",
        "  require(msg.sender == a.producer, 'Vault: not producer');",
        "  require(!a.repaid, 'Vault: already repaid');",
        "",
        "  (,, uint256 totalOwed) = getAmountOwed(advId);",
        "",
        "  // Transfer total from producer to vault, then burn all of it",
        "  mrt.transferFrom(msg.sender, address(this), totalOwed);",
        "  mrt.burn(address(this), totalOwed); // burn EVERYTHING including interest",
        "",
        "  a.repaid = true;",
        "  // Release collateral NFT to the product buyer (or back to producer)",
        "  materialNFT.transferFrom(address(this), a.producer, a.collateralNFTId);",
        "",
        "  emit AdvanceRepaid(advId, a.producer, a.principalMRT, totalOwed - a.principalMRT, block.timestamp);",
        "}",
      ],
      check: "After repayAdvance(), vault holds 0 MRT. Total MRT supply decreases by (principal + interest)."
    },
    {
      title: "Implement early repayment rebate",
      detail: [
        "If repaid before 90 days from start, a rebate of 50% of accrued interest is returned to the producer (not burned).",
        "This creates a strong incentive to repay quickly: the faster you sell your product and repay, the lower your net cost.",
        "Implement: if (elapsed < 90 days) { uint256 rebate = interest / 2; burn(total - rebate); transfer(rebate, producer); } else { burn(total); }",
        "Emit: EarlyRepaymentRebate(advanceId, producer, rebateAmount) when rebate is paid."
      ],
      check: "Repaying within 90 days results in producer receiving rebate. Repaying at day 91 results in zero rebate."
    },
    {
      title: "Apply identical changes to ResourceAdvanceVault.sol",
      detail: [
        "The same interest accrual logic, getAmountOwed(), repayAdvance(), and early rebate must be applied to ResourceAdvanceVault.sol identically.",
        "Resource advances use a separate DAO-governed interest rate (stored separately in ParameterStore as resourceAdvanceRateBPS). Default: 400 BPS = 4% APY (slightly higher than labor, reflecting higher risk)."
      ],
      check: "ResourceAdvanceVault.getAmountOwed() returns correct interest at 4% APY after vm.warp(365 days)."
    },
    {
      title: "Add interestRateBPS parameter to ParameterStore.sol",
      detail: [
        "Add: uint256 public laborAdvanceRateBPS = 300; // 3% default",
        "Add: uint256 public resourceAdvanceRateBPS = 400; // 4% default",
        "Add: uint256 public constant MAX_ADVANCE_RATE_BPS = 1000; // 10% cap — DAO cannot set above this",
        "Add setter functions callable only by DAO governance timelock."
      ],
      check: "DAO governance vote to set laborAdvanceRateBPS = 500 succeeds. Setting to 1100 reverts with 'ParameterStore: exceeds max rate'."
    }
  ],
  testCode: [
    "function test_interestAccruesCorrectly() public {",
    "  uint256 advId = vault.requestAdvance(SKU_A, 1000e18, nftId, OCC_GENERAL, COUNTRY_US, 100);",
    "  // After exactly 365 days at 300 BPS = 3% interest",
    "  vm.warp(block.timestamp + 365 days);",
    "  (, uint256 interest, uint256 total) = vault.getAmountOwed(advId);",
    "  // Principal = 500 MRT (50% of 1000). Interest = 500 * 3% = 15 MRT",
    "  assertApproxEqRel(interest, 15e18, 0.001e18); // within 0.1%",
    "  assertEq(total, vault.advances(advId).principalMRT + interest);",
    "}",
    "",
    "function test_interestIsBurned() public {",
    "  uint256 supply0 = mrt.totalSupply();",
    "  uint256 advId = vault.requestAdvance(SKU_A, 1000e18, nftId, OCC_GENERAL, COUNTRY_US, 100);",
    "  vm.warp(block.timestamp + 180 days);",
    "  (,, uint256 total) = vault.getAmountOwed(advId);",
    "  mrt.approve(address(vault), total);",
    "  vault.repayAdvance(advId);",
    "  // Supply must be BELOW original (burned more than minted)",
    "  assertLt(mrt.totalSupply(), supply0);",
    "}",
    "",
    "function test_earlyRepayRebate() public {",
    "  uint256 advId = vault.requestAdvance(SKU_A, 1000e18, nftId, OCC_GENERAL, COUNTRY_US, 100);",
    "  vm.warp(block.timestamp + 60 days); // before 90-day threshold",
    "  (, uint256 interest,) = vault.getAmountOwed(advId);",
    "  uint256 balBefore = mrt.balanceOf(producer);",
    "  vault.repayAdvance(advId);",
    "  uint256 rebate = mrt.balanceOf(producer) - balBefore + vault.advances(advId).principalMRT;",
    "  assertEq(rebate, interest / 2);",
    "}",
  ],
  verifyChecks: [
    "getAmountOwed() returns 0 interest immediately after advance issuance.",
    "After 365 days, interest equals principal * 3% for labor (4% for resource).",
    "repayAdvance() burns exactly (principal + interest), verified by checking totalSupply() before and after.",
    "Early repayment within 90 days: rebate of 50% of accrued interest returned to producer.",
    "autoLiquidate() at 12 months: interest for 365 days is burned along with principal.",
    "DAO can change rate via ParameterStore. New rate applies to NEW advances only, never retroactively to existing ones.",
    "forge test full suite shows zero regressions.",
  ],
  integrationNotes: [
    "The Producer Dashboard must display getAmountOwed() in real time so producers can see their growing obligation. This requires a polling call every block or a WebSocket subscription to the blockchain.",
    "autoLiquidate() (which runs after 12 months on defaulted advances) must also calculate and burn the 365-day interest in addition to the principal. Update autoLiquidate() in the same branch."
  ],
  cautions: [
    "Do NOT apply the new interest rate retroactively to advances created before this fix was deployed. The interestRateBPS stored in each AdvanceRecord at creation time is the rate that applies forever to that advance.",
    "Do NOT allow the interest burn to be redirected to any address under any circumstance. It must be burned. If future governance wants to redirect interest, that requires a separate, explicit governance vote and contract upgrade — not a parameter change.",
    "Do NOT forget to apply identical changes to ResourceAdvanceVault. These two contracts are mirrors of each other and must stay synchronized."
  ]
}).forEach(item => children.push(item));

children.push(pb());
children.push(banner("TIER 2 — SIGNIFICANT FIXES", "Apply after all Tier 1 fixes are merged and integration tests pass", C.amber));
children.push(gap(120));

// ── FIX-04 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-04",
  severity: "SIGNIFICANT",
  title: "Commodity Basket Peg Divergence — Spot Price vs. Recyclability Value",
  contracts: "CommodityOracle.sol, StabilityModule.sol",
  shortDesc: "The current design pegs MRT to commodity spot prices (futures exchange prices for gold, silver, copper, etc.). Spot prices are driven by speculation, central bank policy, jewelry demand, and geopolitical fear — not by the recyclability utility of those materials. Gold's spot price ($3,200+/oz) vastly exceeds its industrial/recycling value. Pegging MRT to gold spot price connects the currency to gold speculation, which is precisely the financial behavior TRMS is designed to escape.",
  longDesc: [
    "The fix requires the oracle to use SCRAP MARKET prices — what recyclers actually pay per kg of material — not futures exchange prices. Scrap prices are tightly coupled to industrial demand and recycling market conditions, which is exactly what TRMS is trying to measure. Additionally, gold and silver should be significantly downweighted in the basket in favor of high-volume industrial metals (copper, aluminum, steel) that have more stable and recycling-correlated prices."
  ],
  agentSteps: [
    {
      title: "Replace spot price sources with scrap market price feeds in CommodityOracle.sol",
      detail: [
        "Remove references to CME/LME/COMEX futures feeds from the oracle's source list.",
        "Add a new data source tier: SCRAP_MARKET sources. These are Chainlink custom feeds built from iScrap App API, ScrapMonster API, and regional recycling exchange averages.",
        "If Chainlink custom feeds are not yet available for scrap markets at deployment time, use a DAO-operated multi-sig oracle (3-of-5 trusted oracle nodes) that posts scrap prices weekly.",
        "Store a source type flag per commodity: enum OracleSource { SPOT_FUTURES, SCRAP_MARKET, DAO_MULTISIG }. Emit a warning event when DAO_MULTISIG is in use to signal that a real oracle feed is preferred.",
        "The basket calculation always uses the scrap market price when available, falling back to (spot price * 0.35) as a conservative approximation of recyclability value if scrap feed is unavailable."
      ],
      code: [
        "// CommodityOracle.sol — basket price calculation",
        "function getBasketPriceMRT() public view returns (uint256 pricePerGram) {",
        "  uint256 total = 0;",
        "  for (uint i = 0; i < basket.length; i++) {",
        "    BasketEntry memory e = basket[i];",
        "    uint256 rawPrice = _getPriceForSource(e.materialCode, e.source);",
        "    // If source is spot futures, apply recyclability discount",
        "    uint256 adjustedPrice = (e.source == OracleSource.SPOT_FUTURES)",
        "      ? (rawPrice * SPOT_TO_SCRAP_HAIRCUT) / 100  // e.g. 35%",
        "      : rawPrice;",
        "    total += (adjustedPrice * e.weightBPS) / 10_000;",
        "  }",
        "  return total; // MRT per gram of basket",
        "}",
      ],
      check: "Oracle price for gold uses scrap market feed when available. Falls back correctly when feed is stale."
    },
    {
      title: "Update basket composition weights in ParameterStore.sol",
      detail: [
        "Initial new basket weights (DAO can change via governance): COPPER 30%, ALUMINUM 25%, STEEL 20%, SILVER 15%, GOLD 10%.",
        "Rationale: copper and aluminum have the strongest correlation between spot price and scrap market price, making them the most honest backing for MRT recyclability value.",
        "Remove any basket entry with weight 0. Ensure weights sum to exactly 10,000 BPS (100%).",
        "Add validation in ParameterStore: when setting basket weights, revert if sum != 10,000 BPS."
      ],
      check: "Setting basket weights that do not sum to 10,000 BPS reverts with 'ParameterStore: basket weights must sum to 100%'."
    },
    {
      title: "Update StabilityModule.sol to use the corrected oracle",
      detail: [
        "StabilityModule reads the basket price from CommodityOracle. No changes to StabilityModule logic are needed — only ensure it reads from CommodityOracle and CommodityOracle.getBasketPriceMRT() now returns the corrected scrap-market-based price.",
        "Add a StabilityModule event: BasketPriceUpdated(uint256 newPrice, uint256 timestamp) emitted every time a new basket price is used in a stability calculation."
      ],
      check: "StabilityModule uses updated scrap-based price within one oracle update cycle after oracle fix is deployed."
    }
  ],
  testCode: [
    "function test_spotFuturesPriceAppliesHaircut() public {",
    "  // Set gold source to SPOT_FUTURES",
    "  oracle.setSource(GOLD, OracleSource.SPOT_FUTURES);",
    "  oracle.setRawPrice(GOLD, 3200e18); // $3200/oz equivalent",
    "  uint256 price = oracle.getBasketPriceMRT();",
    "  // Gold weight is 10%, haircut 35%, so gold contribution = 3200 * 0.35 * 0.10",
    "  assertApproxEqRel(price, _expectedBasketWithHaircut(), 0.001e18);",
    "}",
    "",
    "function test_scrapMarketPriceNoHaircut() public {",
    "  oracle.setSource(COPPER, OracleSource.SCRAP_MARKET);",
    "  oracle.setRawPrice(COPPER, 8e18); // $8/kg scrap copper",
    "  uint256 price = oracle.getBasketPriceMRT();",
    "  // Copper scrap price used directly, no haircut",
    "  assertApproxEqRel(price, _expectedBasketNoHaircut(), 0.001e18);",
    "}",
  ],
  verifyChecks: [
    "Oracle returns scrap-market price when SCRAP_MARKET source is set.",
    "Oracle applies SPOT_TO_SCRAP_HAIRCUT (35%) when SPOT_FUTURES source is set.",
    "Basket weights sum to exactly 10,000 BPS — assert this in a dedicated test.",
    "Changing basket weights via ParameterStore governance takes effect on next oracle call.",
    "Stale scrap feed (> 7 days) falls back to spot-with-haircut and emits a OracleFallback event.",
  ],
  integrationNotes: [
    "The Analytics Dashboard must display both the raw basket price and the source type (scrap vs. spot) for each commodity so the community can monitor data quality.",
    "When scrap market feeds become available as native Chainlink feeds, migrate from DAO_MULTISIG source to SCRAP_MARKET source via a governance parameter change — no contract upgrade needed if the source architecture is implemented correctly."
  ],
  cautions: [
    "Do NOT use TWAP on scrap market prices the same way as futures prices. Scrap prices update weekly, not per-minute. The freshness threshold for scrap feeds should be 7 days, not 1 hour.",
    "Do NOT allow the SPOT_TO_SCRAP_HAIRCUT to be set below 20% via governance. This would effectively allow speculative futures prices back into the peg calculation."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-05 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-05",
  severity: "SIGNIFICANT",
  title: "Sybil Recycle Center Attack — One Entity, Many Identities",
  contracts: "RecycleCenterRegistry.sol, NEW: CenterVerifier.sol",
  shortDesc: "The current registry requires only a minimum TRMS stake to register a Recycle Center. A well-funded actor can register 50 separate Center identities under 50 legal entities, each staking the minimum, and coordinate them to run a large-scale certification fraud operation. The flat staking minimum does not scale the cost of attack with the volume of fraud.",
  agentSteps: [
    {
      title: "Implement volume-proportional bonding in RecycleCenterRegistry.sol",
      detail: [
        "Replace the flat minimum stake with a dynamic bond formula: requiredStakeTRMS = BASE_STAKE + (monthlyVolumeKg * STAKE_PER_KG).",
        "BASE_STAKE: DAO-set, initially 50,000 TRMS.",
        "STAKE_PER_KG: DAO-set, initially 1 TRMS per 1,000 kg/month of certified material capacity.",
        "A Center declaring capacity of 1,000,000 kg/month must stake 50,000 + 1,000 = 51,000 TRMS.",
        "Track monthlyVolumeKg as a rolling 30-day average from actual on-chain certification data — not self-declared capacity.",
        "If actual volume exceeds declared capacity by >10%, the Center is automatically placed on probation and must top up its bond within 30 days or face suspension.",
        "Add: mapping(address => uint256) public monthlyVolumeKg30d — updated by a keeper every 30 days."
      ],
      code: [
        "function getRequiredStake(address center) public view returns (uint256) {",
        "  uint256 vol = monthlyVolumeKg30d[center];",
        "  return BASE_STAKE + (vol * STAKE_PER_KG / 1_000);",
        "}",
        "",
        "function checkBondSufficiency(address center) public view returns (bool) {",
        "  return stakedTRMS[center] >= getRequiredStake(center);",
        "}",
      ],
      check: "A center with 0 volume needs exactly BASE_STAKE. With 1M kg/month volume needs significantly more."
    },
    {
      title: "Create CenterVerifier.sol — physical identity verification",
      detail: [
        "New contract that manages the in-person verification process for Recycle Centers.",
        "Add: mapping(address => VerificationStatus) public centerStatus — enum: UNVERIFIED, PENDING_VISIT, VERIFIED, SUSPENDED, DEREGISTERED.",
        "Centers in UNVERIFIED or PENDING_VISIT status can NOT mint MaterialNFTs. Only VERIFIED centers can.",
        "Add: function scheduleVerificationVisit(address center) external onlyRole(DAO_VERIFIER_ROLE) — marks center as PENDING_VISIT and assigns a DAO verifier address.",
        "Add: function completeVerification(address center, bytes calldata verifierSignature) external — the assigned verifier signs off after the physical visit. Requires the verifier's Ethereum key to sign a message containing the center address + visit timestamp.",
        "RecycleCenterRegistry.mintMaterial() must call CenterVerifier.isVerified(center) before proceeding. Unverified centers always revert."
      ],
      check: "Minting from an UNVERIFIED center reverts with 'CenterVerifier: not verified'."
    },
    {
      title: "Add entity concentration check to RecycleCenterRegistry.sol",
      detail: [
        "Add: mapping(address => address[]) public entityToCenters — maps a legal entity address to all Centers it controls.",
        "Legal entity linkage is established during the verification process (verifier records the beneficial owner's address).",
        "Add: uint256 public constant MAX_CENTERS_PER_ENTITY = 5 — DAO-governed parameter.",
        "Before completing verification of a new Center, check if the entity already controls MAX_CENTERS_PER_ENTITY Centers. Revert if so.",
        "Add: uint256 public constant MAX_CAPACITY_PCT_PER_ENTITY = 15 — no single entity may control more than 15% of total system certification capacity.",
        "Emit: EntityCapacityWarning(entity, currentPct) when any entity exceeds 10% (warning level before hard limit)."
      ],
      check: "Registering a 6th center under the same entity reverts when MAX_CENTERS_PER_ENTITY = 5."
    }
  ],
  testCode: [
    "function test_unverifiedCenterCannotMint() public {",
    "  // Register center but skip verification",
    "  registry.register(CENTER_NEW, 50_000e18);",
    "  vm.expectRevert('CenterVerifier: not verified');",
    "  materialNFT.mintMaterial(alice, _makeMaterialData(CENTER_NEW, 1000, 'COPPER'));",
    "}",
    "",
    "function test_entityConcentrationCap() public {",
    "  // Register 5 centers under ENTITY_A — should succeed",
    "  for (uint i = 0; i < 5; i++) _registerAndVerify(ENTITY_A, i);",
    "  // 6th registration for same entity should revert",
    "  vm.expectRevert('Registry: entity at center limit');",
    "  _registerAndVerify(ENTITY_A, 5);",
    "}",
  ],
  verifyChecks: [
    "Unverified center cannot mint MaterialNFTs.",
    "Verified center can mint MaterialNFTs.",
    "Entity with 5 verified centers cannot register a 6th.",
    "Center with volume exceeding declared capacity by >10% is placed on automatic probation.",
    "EntityCapacityWarning event emitted when entity reaches 10% of system capacity.",
  ],
  integrationNotes: [
    "CenterVerifier.sol is a NEW contract. It must be deployed before RecycleCenterRegistry is modified. Update RecycleCenterRegistry constructor/initializer to accept the CenterVerifier address.",
    "The DAO Verifier Role must be distributed to a multi-sig of at least 5 trusted geographic representatives — not held by a single DAO member."
  ],
  cautions: [
    "Do NOT make MAX_CENTERS_PER_ENTITY = 1 in early stages. Legitimate recycling businesses with multiple facilities exist and are valuable to the network. 5 is a reasonable starting ceiling.",
    "Do NOT allow the verification process to be completed digitally only. The physical visit component is the anti-Sybil mechanism. Remote-only verification defeats the purpose."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-06 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-06",
  severity: "SIGNIFICANT",
  title: "Oracle Manipulation — Flash Loan Price Spike Exploit",
  contracts: "CommodityOracle.sol, LaborRateOracle.sol",
  shortDesc: "If commodity price oracles report a sudden spike (caused by flash loan manipulation, oracle node compromise, or genuine market event), the mintable MRT for any advance issued in that window is inflated. An attacker who can push a Chainlink feed up 20% for one block can mint 20% more MRT than the backing justifies in that same block, then exit before the price corrects.",
  agentSteps: [
    {
      title: "Implement 24-hour TWAP for all advance calculations in CommodityOracle.sol",
      detail: [
        "Replace all spot-price reads with 24-hour Time-Weighted Average Price (TWAP) reads.",
        "Maintain a circular price history buffer: uint256[96] priceHistory and uint256[96] timestampHistory — 96 slots = one reading per 15 minutes for 24 hours.",
        "Add: function updatePrice(bytes32 materialCode, uint256 price) external onlyRole(ORACLE_UPDATER) — called by keeper every 15 minutes. Updates the circular buffer.",
        "Add: function getTWAP(bytes32 materialCode) public view returns (uint256) — computes the simple average over all non-stale slots in the last 24 hours.",
        "LaborAdvanceVault and ResourceAdvanceVault MUST call getTWAP() not getSpotPrice() for advance sizing."
      ],
      code: [
        "uint8  private constant SLOTS = 96;  // 24h at 15-min intervals",
        "uint256[96] private priceHistory;",
        "uint256[96] private tsHistory;",
        "uint8  private headSlot;",
        "",
        "function getTWAP(bytes32 matCode) public view returns (uint256 avg) {",
        "  uint256 sum; uint256 count;",
        "  uint256 cutoff = block.timestamp - 24 hours;",
        "  for (uint8 i = 0; i < SLOTS; i++) {",
        "    if (tsHistory[i] >= cutoff) { sum += priceHistory[i]; count++; }",
        "  }",
        "  require(count > 0, 'Oracle: no TWAP data');",
        "  avg = sum / count;",
        "}",
      ],
      check: "getTWAP() after seeding 96 slots returns the mathematical average. After a single extreme outlier reading, TWAP moves less than 1.1% from baseline."
    },
    {
      title: "Add per-oracle circuit breaker",
      detail: [
        "Add: mapping(bytes32 => uint256) public lastTWAP — stores previous TWAP for each commodity.",
        "In updatePrice(), after computing new TWAP: if abs(newTWAP - lastTWAP) / lastTWAP > CIRCUIT_BREAKER_PCT (initially 10%), set oraclePaused[materialCode] = true and emit OracleCircuitBreaker(materialCode, newTWAP, lastTWAP).",
        "While paused, getTWAP() reverts and all advances referencing that commodity are paused.",
        "Add: function resetCircuitBreaker(bytes32 materialCode) external onlyRole(DAO_GUARDIAN) — manual reset after DAO review.",
        "Auto-reset: if the following 6 TWAP updates (1.5 hours) are all within 5% of lastTWAP, the circuit auto-resets."
      ],
      check: "A 15% price spike triggers circuit breaker. All advances pause. 6 stable readings auto-reset it."
    },
    {
      title: "Require minimum 3 independent oracle node confirmations per price reading",
      detail: [
        "Each call to updatePrice() requires 3 separate signed readings from 3 independent Chainlink node operators.",
        "The contract uses the median of the 3 readings (not the average) to resist outlier manipulation.",
        "Add: struct OracleReading { address node; uint256 price; uint256 timestamp; bytes sig; }",
        "updatePrice() accepts OracleReading[3] calldata readings, verifies each signature, verifies all 3 nodes are registered, takes the median price."
      ],
      check: "Two readings submitted (not three) reverts. Three readings with one extreme outlier uses median (discards outlier)."
    }
  ],
  testCode: [
    "function test_twapResistsFlashSpike() public {",
    "  // Seed 95 normal readings at $8/kg copper",
    "  for (uint i = 0; i < 95; i++) oracle.updatePrice(COPPER, 8e18);",
    "  // One extreme spike: $80/kg (10x)",
    "  oracle.updatePrice(COPPER, 80e18);",
    "  uint256 twap = oracle.getTWAP(COPPER);",
    "  // TWAP should be (95 * 8 + 80) / 96 ≈ 8.75 — less than 10% above normal",
    "  assertLt(twap, 9e18); // must be below $9",
    "}",
    "",
    "function test_circuitBreakerTriggersOn10PctMove() public {",
    "  _seedNormalReadings(COPPER, 8e18, 48);",
    "  oracle.updatePrice(COPPER, 8.81e18); // exactly 10.1% spike",
    "  assertTrue(oracle.oraclePaused(COPPER));",
    "}",
  ],
  verifyChecks: [
    "TWAP over 96 slots returns mathematical average of all non-stale slots.",
    "Single 10x price spike moves TWAP less than 10%.",
    "Circuit breaker triggers on >10% TWAP delta between updates.",
    "All advances revert while any referenced commodity oracle is paused.",
    "Manual circuit breaker reset requires DAO_GUARDIAN role.",
    "6 consecutive stable readings auto-reset circuit breaker.",
    "Median of 3 oracle readings correctly discards extreme outlier.",
  ],
  integrationNotes: [
    "A Chainlink Automation job must be set up to call updatePrice() every 15 minutes for each commodity. If the keeper misses more than 3 consecutive updates (45 minutes), emit a KeeperMissed event and pause new advances as a precaution.",
    "The Analytics Dashboard must display the current TWAP for each commodity alongside the spot price, so the community can see the divergence in real time."
  ],
  cautions: [
    "Do NOT reduce the TWAP window below 6 hours. Shorter windows are increasingly vulnerable to sustained manipulation.",
    "Do NOT use the TWAP for interest rate calculations or governance votes — only for advance sizing. Interest accrues on the principal at the rate agreed at advance creation, regardless of subsequent price moves."
  ]
}).forEach(item => children.push(item));

children.push(pb());
children.push(banner("TIER 3 — STRUCTURAL FIXES", "Apply after all Tier 2 fixes are merged and integration tests pass", C.navyMid));
children.push(gap(120));

// ── FIX-07 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-07",
  severity: "STRUCTURAL",
  title: "Bootstrap Deadlock — Zero Initial MRT Supply",
  contracts: "MRTToken.sol, ProtocolTreasury.sol, NEW: GenesisPool.sol",
  shortDesc: "MRT supply starts at zero. The first labor advance mints MRT — but repayment requires MRT. Buyers cannot buy products in MRT because no MRT exists yet. Producers cannot repay advances in MRT because buyers have no MRT to pay them with. This circular dependency means the economy cannot self-start without an initial liquidity injection.",
  agentSteps: [
    {
      title: "Create src/genesis/GenesisPool.sol (new file)",
      detail: [
        "GenesisPool holds an initial MRT allocation funded by a portion of the TRMS governance token sale proceeds.",
        "GenesisPool mints GENESIS_MRT_AMOUNT (DAO-set, e.g. 1,000,000 MRT) at deployment, backed by a Genesis Reserve of TRMS tokens locked in the contract.",
        "This genesis MRT is distributed via a bootstrapping mechanism: 50% to a DEX liquidity pool (MRT/xDAI on Gnosis Chain), 30% to the ProtocolTreasury for operating expenses, 20% to early Recycle Center operators as a onboarding grant.",
        "GenesisPool MRT is clearly labeled as 'genesis-backed' in the MRTToken with a genesisSupply counter that is tracked separately from organically-backed supply.",
        "The Genesis Reserve of TRMS tokens is gradually sold as organic MRT supply grows. When organicMRTSupply >= 2 * genesisSupply, the GenesisPool is considered 'repaid' and its remaining TRMS reserve is transferred to the DAO treasury."
      ],
      code: [
        "// GenesisPool.sol",
        "uint256 public constant GENESIS_MRT_AMOUNT = 1_000_000 * 1e18;",
        "uint256 public genesisSupplyRemaining;",
        "",
        "function initialize(address mrtToken, address treasury) external initializer {",
        "  // Mint genesis MRT — this is the ONLY time MRT is minted without",
        "  // a corresponding advance or material NFT",
        "  IMRTToken(mrtToken).mintGenesis(address(this), GENESIS_MRT_AMOUNT);",
        "  genesisSupplyRemaining = GENESIS_MRT_AMOUNT;",
        "  // Distribute: 50% DEX, 30% treasury, 20% operator grants",
        "  _distributeLiquidity(mrtToken, treasury);",
        "}",
        "",
        "// MRTToken must track genesis vs organic supply separately",
        "function mintGenesis(address to, uint256 amount)",
        "  external onlyRole(GENESIS_POOL_ROLE) {",
        "  require(!genesisComplete, 'MRT: genesis already executed');",
        "  genesisComplete = true;",
        "  _mint(to, amount);",
        "  genesisSupply = amount;",
        "}",
      ],
      check: "GenesisPool can only call mintGenesis() once. Second call reverts."
    },
    {
      title: "Add genesisSupply and organicSupply tracking to MRTToken.sol",
      detail: [
        "Add: uint256 public genesisSupply — set once by GenesisPool, never changes.",
        "Add: uint256 public organicSupply — incremented by every organic mint (advances, materials), decremented by every burn.",
        "Add: function getSupplyRatio() public view returns (uint256) — returns organicSupply * 100 / genesisSupply. When >= 200 (2:1 ratio), the genesis pool is considered bootstrapped.",
        "Add: event GenesisBootstrapComplete(uint256 organicSupply, uint256 genesisSupply) — emitted when ratio first crosses 200."
      ],
      check: "After bootstrapping, organicSupply / genesisSupply >= 2 triggers the event exactly once."
    },
    {
      title: "Create DEX liquidity bootstrapping in ProtocolTreasury.sol",
      detail: [
        "Add function: seedDEXLiquidity(address dexRouter, uint256 mrtAmount, uint256 xdaiAmount) external onlyGenesis.",
        "This function calls the Gnosis Chain DEX router (Swapr or Honeyswap) to create the initial MRT/xDAI liquidity pool.",
        "The LP tokens received are locked in ProtocolTreasury for 12 months (protocol-owned liquidity, not removable by any party including DAO during lockup).",
        "After 12 months, the DAO can vote to manage or migrate the liquidity."
      ],
      check: "After seedDEXLiquidity(), MRT/xDAI pool exists with non-zero liquidity on the target DEX."
    }
  ],
  testCode: [
    "function test_genesisCanOnlyRunOnce() public {",
    "  genesisPool.initialize(address(mrt), address(treasury));",
    "  vm.expectRevert('MRT: genesis already executed');",
    "  genesisPool.initialize(address(mrt), address(treasury));",
    "}",
    "",
    "function test_genesisSupplyTrackedSeparately() public {",
    "  genesisPool.initialize(address(mrt), address(treasury));",
    "  assertEq(mrt.genesisSupply(), GENESIS_MRT_AMOUNT);",
    "  assertEq(mrt.organicSupply(), 0);",
    "}",
    "",
    "function test_bootstrapCompleteEventEmitsAt2x() public {",
    "  genesisPool.initialize(address(mrt), address(treasury));",
    "  // Simulate organic minting to 2x genesis",
    "  vm.prank(address(laborVault));",
    "  mrt.mint(alice, 2 * GENESIS_MRT_AMOUNT);",
    "  // Event should have been emitted",
    "  // (check via vm.expectEmit before the mint call)",
    "}",
  ],
  verifyChecks: [
    "GenesisPool mintGenesis() succeeds exactly once and reverts on any subsequent call.",
    "genesisSupply is set correctly and never changes after initialization.",
    "organicSupply increments with every organic mint and decrements with every burn.",
    "DEX liquidity pool seeded with correct ratio of MRT to xDAI.",
    "LP tokens from genesis liquidity are locked for 12 months — withdrawal reverts before lock expiry.",
    "GenesisBootstrapComplete event emits when organicSupply first reaches 2x genesisSupply."
  ],
  integrationNotes: [
    "The GenesisPool deployment is a one-time, irreversible action. It must be the last step in the mainnet deployment sequence, after all other contracts are deployed, configured, and audited.",
    "The 20% operator grant (200,000 MRT) must be distributed to the first cohort of verified Recycle Center operators before public launch so they have MRT to operate with from day one."
  ],
  cautions: [
    "Do NOT allow the DAO to mint additional genesis-style MRT after launch under any circumstances. The genesis mechanism is a one-time bootstrap. If more liquidity is needed later, the DAO uses treasury funds or grants — not protocol minting.",
    "Do NOT set GENESIS_MRT_AMOUNT so large that it takes years for organic supply to reach 2x. A ratio of 1,000,000 genesis MRT assumes the economy will organically generate 2,000,000 MRT within 18-24 months of operation — calibrate to realistic adoption projections."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-08 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-08",
  severity: "STRUCTURAL",
  title: "Recycle Center Geographic Capture — Majority Control by Coordinated Actor",
  contracts: "RecycleCenterRegistry.sol, ParameterStore.sol",
  shortDesc: "A well-funded nation-state, corporation, or cartel could acquire majority control of certified Recycle Centers in a region or globally, effectively controlling MRT issuance in that region and replicating the monetary control TRMS is designed to eliminate. The current design has no concentration limits.",
  agentSteps: [
    {
      title: "Add geographic capacity tracking to RecycleCenterRegistry.sol",
      detail: [
        "Add: mapping(bytes2 => uint256) public capacityByCountry — ISO 3166 country codes map to total certified monthly kg/month.",
        "Add: uint256 public totalGlobalCapacity — sum of all centers' capacities.",
        "Add: function getCountryCapacityPct(bytes2 country) public view returns (uint256) — returns capacity as % of global total (in BPS).",
        "Update this on every center registration, capacity update, suspension, and deregistration."
      ],
      check: "After registering centers, getCountryCapacityPct() returns correct percentage."
    },
    {
      title: "Implement entity concentration cap enforcement",
      detail: [
        "Add to ParameterStore: uint256 public maxEntityCapacityBPS = 1500 (15% of global capacity).",
        "Add to ParameterStore: uint256 public maxCountryCapacityBPS = 3000 (30% per country).",
        "In RecycleCenterRegistry.completeVerification(): before marking center as VERIFIED, check that the entity's total capacity after this addition does not exceed maxEntityCapacityBPS. Revert if so.",
        "In RecycleCenterRegistry.completeVerification(): check that the country's total capacity after this addition does not exceed maxCountryCapacityBPS. Revert if so.",
        "Emit: ConcentrationCapReached(entity, countryCode, currentBPS, maxBPS) when a registration is blocked by these limits."
      ],
      code: [
        "function completeVerification(address center, bytes calldata sig) external {",
        "  // ... existing verification logic ...",
        "  address entity = centerEntity[center];",
        "  bytes2  country = centerCountry[center];",
        "",
        "  uint256 entityAfter = entityCapacity[entity] + centerDeclaredCapacity[center];",
        "  uint256 countryAfter = capacityByCountry[country] + centerDeclaredCapacity[center];",
        "  uint256 globalAfter = totalGlobalCapacity + centerDeclaredCapacity[center];",
        "",
        "  require(",
        "    (entityAfter * 10_000) / globalAfter <= maxEntityCapacityBPS,",
        "    'Registry: entity exceeds concentration cap'",
        "  );",
        "  require(",
        "    (countryAfter * 10_000) / globalAfter <= maxCountryCapacityBPS,",
        "    'Registry: country exceeds concentration cap'",
        "  );",
        "  // ... proceed with verification ...",
        "}",
      ],
      check: "Registering a center that would push one entity above 15% global capacity reverts."
    },
    {
      title: "Add concentration monitoring events and DAO alert system",
      detail: [
        "At 80% of the entity cap (12% of global capacity), emit: ConcentrationWarning(entity, currentBPS) — does not block registration but alerts the community.",
        "DAO Guardians can flag any entity for concentration review regardless of current percentage if behavioral signals suggest coordinated operation.",
        "Flagged entities have new center registrations paused until the DAO votes to clear the flag."
      ],
      check: "ConcentrationWarning emitted when entity reaches 12% of global capacity."
    }
  ],
  testCode: [
    "function test_entityCapCapEnforced() public {",
    "  // Register centers for ENTITY_A until they hit 15% global cap",
    "  _registerCentersUpToCap(ENTITY_A, 1500); // 15%",
    "  // One more should revert",
    "  vm.expectRevert('Registry: entity exceeds concentration cap');",
    "  _registerOneMoreCenter(ENTITY_A);",
    "}",
    "",
    "function test_countryCapCapEnforced() public {",
    "  // Fill US up to 30% of global capacity via multiple entities",
    "  _fillCountryCapacity(COUNTRY_US, 3000);",
    "  vm.expectRevert('Registry: country exceeds concentration cap');",
    "  _registerCenterInCountry(COUNTRY_US, NEW_ENTITY);",
    "}",
  ],
  verifyChecks: [
    "Entity at 14.9% global capacity: new registration allowed.",
    "Entity at exactly 15% global capacity: new registration reverts.",
    "Country at 29.9% global capacity: new center allowed.",
    "Country at exactly 30% global capacity: new center reverts.",
    "ConcentrationWarning emitted at 80% of entity cap (12%).",
    "Capacity counters correctly updated when a center is suspended or deregistered.",
  ],
  integrationNotes: [
    "Capacity calculations must use actual on-chain volume (from MaterialNFT certification events) for established centers and declared capacity for new registrations. Declared capacity is updated to actual volume after the first 90 days of operation.",
    "The Analytics Dashboard must display a global heat map of Recycle Center concentration by country and by entity, updated in real time from The Graph."
  ],
  cautions: [
    "Do NOT check concentration caps for the first 50 Recycle Centers globally. With very low global capacity, any single center will appear to exceed the cap percentage. Enable the cap enforcement only after totalGlobalCapacity exceeds a minimum threshold (e.g. 10,000 tonnes/month).",
    "Do NOT allow the maxEntityCapacityBPS to be raised above 2500 (25%) via governance. This is a security ceiling, not a preference setting."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-09 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-09",
  severity: "STRUCTURAL",
  title: "Physical Product Boundary Erosion — Definitional Drift Over Time",
  contracts: "ProductRegistry.sol, ParameterStore.sol",
  shortDesc: "Without a precisely encoded and constitutionally protected definition of 'physical product,' governance pressure will gradually expand eligibility to include digital goods, services, and intangibles. This erodes the entire basis of MRT — that it is backed by real, physical, recyclable wealth. Definitional drift is how sound money systems historically become fiat systems.",
  agentSteps: [
    {
      title: "Encode a precise, machine-checkable eligibility standard in ProductRegistry.sol",
      detail: [
        "Products must meet ALL of the following criteria to be eligible for advance benefits:",
        "CRITERION A: Mass >= MIN_PRODUCT_MASS_GRAMS (DAO-set, initially 100 grams). Store in ParameterStore.",
        "CRITERION B: recyclableContentPct >= MIN_RECYCLABLE_PCT (DAO-set, initially 10%). Products with zero recyclable content get no material benefit, but can still get labor advances.",
        "CRITERION C: At least one material in the Bill of Materials (BoM) must have a documented recycling pathway in the ISO 14040 Life Cycle Assessment standards, verified by a certified inspector.",
        "CRITERION D: Product must be a tangible manufactured good — not software, not a service contract, not a financial instrument. This is encoded as a ProductCategory enum: MANUFACTURED_GOOD, NATURAL_RESOURCE_PRODUCT, CONSTRUCTION_MATERIAL, AGRICULTURAL_PRODUCT. Only these four categories are eligible.",
        "Any registered product that fails any criterion is rejected at registration time. Once registered, a product can be audited and de-registered if found non-compliant."
      ],
      code: [
        "// ProductRegistry.sol",
        "enum ProductCategory {",
        "  MANUFACTURED_GOOD,      // 0 — eligible",
        "  NATURAL_RESOURCE_PRODUCT, // 1 — eligible",
        "  CONSTRUCTION_MATERIAL,  // 2 — eligible",
        "  AGRICULTURAL_PRODUCT,   // 3 — eligible",
        "  DIGITAL_GOOD,           // 4 — NOT eligible",
        "  SERVICE,                // 5 — NOT eligible",
        "  FINANCIAL_INSTRUMENT    // 6 — NOT eligible",
        "}",
        "",
        "uint256 constant INELIGIBLE_CATEGORY_THRESHOLD = 4;",
        "",
        "function registerProduct(ProductData calldata d) external returns (bytes32 sku) {",
        "  require(d.massGrams >= paramStore.minProductMassGrams(),",
        "    'Registry: mass below minimum');",
        "  require(uint(d.category) < INELIGIBLE_CATEGORY_THRESHOLD,",
        "    'Registry: ineligible product category');",
        "  require(d.hasISO14040Pathway, 'Registry: no documented recycling pathway');",
        "  // ... rest of registration",
        "}",
      ],
      check: "Attempting to register a DIGITAL_GOOD reverts. A MANUFACTURED_GOOD with mass >= 100g succeeds."
    },
    {
      title: "Constitutional lock on core eligibility parameters in ParameterStore.sol",
      detail: [
        "Mark the following parameters as 'constitutionally protected': MIN_PRODUCT_MASS_GRAMS, MIN_RECYCLABLE_PCT, eligible ProductCategory list, INELIGIBLE_CATEGORY_THRESHOLD.",
        "Constitutional parameters require: 90% supermajority DAO vote, 60-day public comment period (stored as a published IPFS document hash in the proposal), and a 30-day timelock after vote passes.",
        "Regular parameters (advance percentages, fee rates, oracle addresses) require only simple majority with standard 48-hour timelock.",
        "Add: mapping(bytes32 => bool) public isConstitutionalParam in ParameterStore. Set to true for protected params at deployment. Cannot be set to false by any governance action."
      ],
      code: [
        "// ParameterStore.sol",
        "modifier onlyConstitutionalVote() {",
        "  require(",
        "    IDao(dao).getProposalSupermajority(msg.sig) >= 9000, // 90%",
        "    'ParameterStore: requires 90% supermajority'",
        "  );",
        "  require(",
        "    IDao(dao).getCommentPeriodComplete(msg.sig),",
        "    'ParameterStore: 60-day comment period not complete'",
        "  );",
        "  _;",
        "}",
        "",
        "function setMinProductMassGrams(uint256 newMass)",
        "  external onlyConstitutionalVote {",
        "  // Can only be decreased, never increased to exclude more products",
        "  require(newMass <= minProductMassGrams, 'ParameterStore: cannot raise mass floor');",
        "  minProductMassGrams = newMass;",
        "}",
      ],
      check: "setMinProductMassGrams() called by standard DAO timelock (not supermajority) reverts."
    },
    {
      title: "Add product audit mechanism to ProductRegistry.sol",
      detail: [
        "Any DAO member can file an audit request against any registered product by staking 1,000 MRT.",
        "An audit assigns 3 certified inspectors to review the product's BoM and physical characteristics.",
        "If audit finds non-compliance: product is de-registered, all associated advances become immediately due, the filing member's stake is returned plus 500 MRT reward from ProtocolTreasury.",
        "If audit finds compliance: filing member's stake is forfeited to ProtocolTreasury (prevents frivolous audits)."
      ],
      check: "A product found non-compliant on audit triggers de-registration and advance acceleration."
    }
  ],
  testCode: [
    "function test_digitalGoodRejected() public {",
    "  ProductData memory d = _makeProduct(ProductCategory.DIGITAL_GOOD, 0, false);",
    "  vm.expectRevert('Registry: ineligible product category');",
    "  registry.registerProduct(d);",
    "}",
    "",
    "function test_underweightProductRejected() public {",
    "  ProductData memory d = _makeProduct(ProductCategory.MANUFACTURED_GOOD, 50, true); // 50g < 100g",
    "  vm.expectRevert('Registry: mass below minimum');",
    "  registry.registerProduct(d);",
    "}",
    "",
    "function test_constitutionalParamRequiresSupermajority() public {",
    "  // Standard DAO vote (simple majority) attempts to change mass floor",
    "  vm.prank(address(dao)); // standard execution",
    "  vm.expectRevert('ParameterStore: requires 90% supermajority');",
    "  paramStore.setMinProductMassGrams(50);",
    "}",
  ],
  verifyChecks: [
    "All four ineligible ProductCategory values (DIGITAL_GOOD, SERVICE, FINANCIAL_INSTRUMENT) revert on registration.",
    "Products below MIN_PRODUCT_MASS_GRAMS revert on registration.",
    "Products without ISO 14040 pathway flag revert on registration.",
    "Constitutional parameter change with 89% vote reverts.",
    "Constitutional parameter change with 90% vote and 60-day comment period succeeds.",
    "Product de-registered on audit: all associated open advances accelerate to immediately due.",
  ],
  integrationNotes: [
    "The Producer Dashboard must show a clear eligibility indicator during product registration: which criteria pass, which fail, before the user submits the transaction.",
    "The 60-day comment period for constitutional changes must be backed by an on-chain IPFS document hash stored in the proposal, verified by the ParameterStore modifier."
  ],
  cautions: [
    "Do NOT make the audit mechanism too cheap. A 1,000 MRT bond is the minimum to prevent frivolous audit spam. If MRT price rises significantly, re-evaluate the audit bond amount via governance.",
    "Do NOT allow the ProductCategory enum to be extended by governance without a constitutional vote. Adding new eligible categories is a constitutional change."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FIX-10 ───────────────────────────────────────────────────────────────────
problemSection({
  id: "FIX-10",
  severity: "STRUCTURAL",
  title: "RBE Transition End-State is Undefined — No Measurable Trigger",
  contracts: "ParameterStore.sol, NEW: TransitionMonitor.sol",
  shortDesc: "TRMS's stated long-term goal is to generate such abundance that profit-seeking becomes unnecessary and the world transitions to a Resource-Based Economy (RBE). This is the most ambitious and most important part of the vision. It is also completely unmeasured in the current design. Without on-chain metrics, observable thresholds, and a defined transition protocol, the RBE goal remains a philosophical aspiration rather than an engineered outcome.",
  longDesc: [
    "This is not a bug — it is a missing feature of profound importance. The RBE transition is the entire purpose of the TRMS. Every design decision made in the preceding nine fixes either helps or hinders the rate of progress toward this goal. If progress is not measured, it cannot be optimized. If the transition trigger is not defined, the system has no end-state to converge toward and the DAO has no basis for governance decisions about when to reduce profit incentives."
  ],
  agentSteps: [
    {
      title: "Create src/monitor/TransitionMonitor.sol (new file)",
      detail: [
        "TransitionMonitor aggregates four on-chain metrics that together constitute a measurable proxy for 'approaching RBE conditions'.",
        "METRIC 1 — MRT Per Capita Index (MPCI): totalMRTSupply / estimatedActiveParticipants. Target: 10,000 MRT per participant. Source: MRTToken.totalSupply() / TransitionMonitor.activeParticipants.",
        "METRIC 2 — Producer Profit Margin Index (PPMI): rolling 90-day average of (productSalePrice - totalCostIncludingRepaid) / productSalePrice across all completed product sales. Target: >= 60% average margin. Source: events from LaborAdvanceVault and Open Marketplace.",
        "METRIC 3 — MRT Distribution Gini Coefficient (MDGC): measure of MRT distribution equality across all holding addresses. Target: Gini <= 0.35 (relatively equal). This requires off-chain computation submitted on-chain by a DAO oracle monthly.",
        "METRIC 4 — Free Goods Ratio (FGR): percentage of product categories where the average sale price has dropped below 10% of the median labor cost to produce. Target: >= 30% of product categories. Source: Open Marketplace price oracle.",
        "All four metrics are updated monthly. Each metric's current value and its target threshold are publicly readable from TransitionMonitor."
      ],
      code: [
        "// TransitionMonitor.sol",
        "struct TransitionMetrics {",
        "  uint256 mrtPerCapita;          // MPCI — MRT wei per participant",
        "  uint256 avgProducerMarginBPS;  // PPMI — basis points (10000 = 100%)",
        "  uint256 giniCoefficientBPS;    // MDGC — lower = more equal",
        "  uint256 freeGoodsRatioBPS;     // FGR — % of product categories",
        "  uint256 lastUpdated;",
        "}",
        "",
        "TransitionMetrics public current;",
        "",
        "// Targets — all must be met for 12 consecutive months",
        "uint256 public constant MPCI_TARGET     = 10_000 * 1e18;",
        "uint256 public constant PPMI_TARGET_BPS = 6_000;  // 60%",
        "uint256 public constant MDGC_TARGET_BPS = 3_500;  // Gini <= 0.35",
        "uint256 public constant FGR_TARGET_BPS  = 3_000;  // 30%",
        "",
        "uint256 public consecutiveMonthsMet;",
        "uint256 public constant MONTHS_REQUIRED = 12;",
        "",
        "function isRBEThresholdMet() public view returns (bool) {",
        "  return current.mrtPerCapita    >= MPCI_TARGET",
        "    && current.avgProducerMarginBPS >= PPMI_TARGET_BPS",
        "    && current.giniCoefficientBPS   <= MDGC_TARGET_BPS",
        "    && current.freeGoodsRatioBPS    >= FGR_TARGET_BPS;",
        "}",
      ],
      check: "isRBEThresholdMet() returns false with any single metric below threshold. Returns true only when all four are met simultaneously."
    },
    {
      title: "Implement 12-consecutive-months tracking",
      detail: [
        "Add: function updateMetrics(TransitionMetrics calldata newMetrics) external onlyRole(MONITOR_ORACLE) — called monthly by a DAO-operated oracle.",
        "After each update, call isRBEThresholdMet(). If true, increment consecutiveMonthsMet. If false, reset consecutiveMonthsMet = 0.",
        "When consecutiveMonthsMet reaches MONTHS_REQUIRED (12), emit: RBEThresholdSustained(uint256 month, TransitionMetrics metrics).",
        "This event does NOT automatically trigger any protocol change. It is a signal to the DAO that the community can vote on a formal RBE Transition Proposal."
      ],
      check: "consecutiveMonthsMet resets to 0 if any single metric drops below threshold in any month."
    },
    {
      title: "Define the RBE Transition Protocol in ParameterStore.sol",
      detail: [
        "When the DAO passes a formal RBE Transition Vote (requires 75% supermajority, must reference a RBEThresholdSustained event from the last 3 months), the following protocol parameters change automatically:",
        "STEP A: laborAdvanceRateBPS set to 0 (free labor advances, no interest).",
        "STEP B: resourceAdvanceRateBPS set to 0.",
        "STEP C: A Free Goods Registry is activated — producers can optionally list products at 0 MRT (gifted to the community). The protocol rewards them with TRMS governance tokens as social recognition.",
        "STEP D: A new RBE Prosperity Index (RPI) is published monthly, showing the percentage of basic human needs (food, shelter, clothing, healthcare, education) that can be met at zero MRT cost within the TRMS economy.",
        "Encode all four steps as a single RBETransitionProposal type in TRMSDao.sol."
      ],
      check: "After RBE vote passes, laborAdvanceRateBPS reads as 0 from ParameterStore."
    },
    {
      title: "Add historical metric logging for long-term progress tracking",
      detail: [
        "Store monthly metric snapshots: mapping(uint256 => TransitionMetrics) public monthlyHistory — keyed by month number (block.timestamp / 30 days).",
        "This creates a permanent, queryable on-chain record of the economy's progress toward RBE from genesis to transition.",
        "The Analytics Dashboard should display this as a time-series chart titled: 'Journey to RBE' with a progress indicator for each metric."
      ],
      check: "monthlyHistory[currentMonth] returns the metrics for the current month."
    }
  ],
  testCode: [
    "function test_allMetricsMustBeMet() public {",
    "  // Set 3 of 4 metrics above target",
    "  monitor.updateMetrics(TransitionMetrics({",
    "    mrtPerCapita: MPCI_TARGET + 1,",
    "    avgProducerMarginBPS: PPMI_TARGET_BPS + 1,",
    "    giniCoefficientBPS: MDGC_TARGET_BPS - 1,",
    "    freeGoodsRatioBPS: FGR_TARGET_BPS - 1, // one below target",
    "    lastUpdated: block.timestamp",
    "  }));",
    "  assertFalse(monitor.isRBEThresholdMet());",
    "  assertEq(monitor.consecutiveMonthsMet(), 0);",
    "}",
    "",
    "function test_12ConsecutiveMonthsTriggerEvent() public {",
    "  TransitionMetrics memory good = _allMetricsAboveTarget();",
    "  for (uint i = 0; i < 12; i++) {",
    "    vm.warp(block.timestamp + 30 days);",
    "    monitor.updateMetrics(good);",
    "  }",
    "  assertEq(monitor.consecutiveMonthsMet(), 12);",
    "  // RBEThresholdSustained event should have been emitted",
    "}",
    "",
    "function test_singleBadMonthResetsCounter() public {",
    "  TransitionMetrics memory good = _allMetricsAboveTarget();",
    "  for (uint i = 0; i < 6; i++) {",
    "    vm.warp(block.timestamp + 30 days);",
    "    monitor.updateMetrics(good);",
    "  }",
    "  assertEq(monitor.consecutiveMonthsMet(), 6);",
    "  // One bad month",
    "  vm.warp(block.timestamp + 30 days);",
    "  monitor.updateMetrics(_oneMetricBelowTarget());",
    "  assertEq(monitor.consecutiveMonthsMet(), 0); // reset",",
    "}",
  ],
  verifyChecks: [
    "isRBEThresholdMet() returns false if any single metric is below its target.",
    "consecutiveMonthsMet increments by exactly 1 per monthly update when all metrics are met.",
    "consecutiveMonthsMet resets to 0 when any metric drops below threshold.",
    "RBEThresholdSustained event emits when consecutiveMonthsMet reaches 12.",
    "monthlyHistory stores snapshot for every month — queryable by month number.",
    "After RBE Transition Vote, laborAdvanceRateBPS and resourceAdvanceRateBPS both read as 0.",
  ],
  integrationNotes: [
    "The MONITOR_ORACLE role must be held by a DAO-operated keeper, not any single individual. Use a 3-of-5 multi-sig keeper service.",
    "The Gini Coefficient computation (METRIC 3) cannot be computed efficiently on-chain due to requiring all wallet balances. It must be computed off-chain by the keeper using The Graph data and submitted as a single value with the full computation posted to IPFS for public verification.",
    "The Analytics Dashboard's 'Journey to RBE' visualization is one of the most important user-facing features of the entire system. It should be given priority in frontend development."
  ],
  cautions: [
    "Do NOT allow the RBE Transition Vote to trigger before consecutiveMonthsMet = 12. The 12-month sustained period is a safeguard against temporarily favorable conditions that reverse.",
    "Do NOT make the RBE Transition irreversible. If conditions regress after the transition begins, the DAO must be able to re-activate interest rates and advance constraints. The transition is a phase, not a cliff."
  ]
}).forEach(item => children.push(item));

children.push(pb());

// ── FINAL INTEGRATION CHECKLIST ───────────────────────────────────────────────
children.push(banner(
  "FINAL INTEGRATION VERIFICATION",
  "Run after ALL 10 fixes are merged — in order — before any deployment"
));
children.push(gap(120));

children.push(h2("Complete End-to-End Integration Test Suite"));
children.push(body("The following integration scenarios must all pass before the system is considered ready for audit submission. These tests simulate full economic cycles, not just unit behavior. Run from: test/integration/ with forge test --match-path 'test/integration/*' -vvv"));
children.push(gap(80));

children.push(h3("Scenario A — The Honest Producer (Happy Path)"));
children.push(numItem("Deploy all contracts in correct order (see deployment script)."));
children.push(numItem("Initialize GenesisPool. Verify MRT supply = GENESIS_MRT_AMOUNT. organicSupply = 0."));
children.push(numItem("Register and verify one Recycle Center with IoT device."));
children.push(numItem("Center deposits 1,000 kg of copper. TWAP oracle provides scrap price. MaterialNFT minted. MRT minted to depositor. organicSupply += certifiedValueMRT."));
children.push(numItem("Producer registers product SKU with BoM. Inspector certifies recyclable content."));
children.push(numItem("Producer requests labor advance. LaborRateOracle validates declared cost. Advance issued. MRT minted to producer. NFT locked as collateral."));
children.push(numItem("Buyer purchases product on Open Marketplace in MRT. Producer receives MRT."));
children.push(numItem("Producer calls repayAdvance(). MRT burned (principal + interest). organicSupply decremented. Collateral NFT released to buyer."));
children.push(numItem("Product reaches end of life. Owner brings to Recycle Center. burnOnRecycle() called. MaterialNFT burned. MRT burned. certifiedBatches[mtid] cleared."));
children.push(numItem("ASSERT: Net MRT supply change over full cycle is: +certifiedValueMRT - certifiedValueMRT + small interest burn = net negative. System is mildly deflationary per cycle. ✓"));
children.push(gap(80));

children.push(h3("Scenario B — The Circular Attack (Must Fail)"));
children.push(numItem("Attacker registers as Recycle Center and passes verification."));
children.push(numItem("Attacker deposits 1,000 kg copper. NFT minted with MTID-001. MRT minted."));
children.push(numItem("Attacker attempts to re-certify the SAME lot number from the same center."));
children.push(numItem("ASSERT: Second mintMaterial() reverts with 'MTID: batch already certified'. ✓"));
children.push(numItem("Attacker purchases copper from outside and attempts a new lot. New MTID computed."));
children.push(numItem("ASSERT: New lot with genuinely different IoT sig and lot number succeeds. New MTID is unique. ✓"));
children.push(gap(80));

children.push(h3("Scenario C — The Arbitrageur (Must Be Unprofitable)"));
children.push(numItem("Actor requests maximum labor advance for 365 days."));
children.push(numItem("Actor does NOT repay at 365 days. autoLiquidate() called by anyone."));
children.push(numItem("ASSERT: MRT burned = principal + 365-day interest. Collateral NFT seized by DAO treasury. ✓"));
children.push(numItem("Actor's net position: lost the NFT collateral. No free profit extracted. ✓"));
children.push(gap(80));

children.push(h3("Scenario D — Oracle Attack (Must Be Neutralized)"));
children.push(numItem("Copper TWAP at $8/kg. 95 slots seeded normally."));
children.push(numItem("Attacker pushes copper oracle to $80/kg for one block."));
children.push(numItem("ASSERT: TWAP moves to ~$8.75/kg — well below 10% delta. No circuit breaker. ✓"));
children.push(numItem("Attacker sustains $80/kg for 2 hours (8 consecutive 15-min slots)."));
children.push(numItem("ASSERT: Circuit breaker triggers. All copper-backed advances paused. ✓"));
children.push(numItem("Price returns to $8/kg for 6 consecutive slots."));
children.push(numItem("ASSERT: Circuit breaker auto-resets. Advances resume at correct TWAP. ✓"));

children.push(gap(120));
children.push(h2("Pre-Audit Readiness Checklist"));
children.push(body("Complete every item on this checklist before submitting for formal security audit."));
children.push(gap(60));

const readiness = [
  ["forge test (full suite)", "100% pass, zero failures, zero skips"],
  ["forge test --gas-report", "No function exceeds 500,000 gas"],
  ["forge coverage", "Line coverage >= 95% for all 14 contracts"],
  ["slither .", "Zero high or medium findings. All low findings reviewed and documented"],
  ["forge script CheckStorageLayout", "Zero storage slot conflicts across all proxy upgrades"],
  ["NatSpec completeness", "Every public/external function has @notice, @param, @return"],
  ["Event completeness", "Every state change emits at least one event"],
  ["Deployment script dry-run", "Scripts run end-to-end on Gnosis Chain testnet with zero errors"],
  ["Integration tests (all 4 scenarios)", "All pass on testnet fork"],
  ["Access control audit", "Every role assigned to correct multi-sig or timelock — no EOA role holders"],
  ["UUPS upgrade test", "All contracts successfully upgraded via proxy; storage intact after upgrade"],
  ["Genesis Pool one-time test", "Cannot be called twice — verified on testnet"],
  ["Constitutional param test", "Standard DAO call to constitutional params reverts — confirmed"],
  ["TransitionMonitor oracle", "Monthly update keeper running on testnet — 3 consecutive updates verified"],
];

children.push(twoColTable([
  twoColHeader("Checklist Item", "Required Outcome / Command"),
  ...readiness.map(([a,b], i) => twoColRow(a, b, i % 2 === 0 ? C.white : C.grayLight))
]));

children.push(gap(120));
children.push(h2("Questions the Auditor Will Ask — Prepare Answers"));
children.push(body("A professional smart contract auditor (Trail of Bits, Certora, Sherlock, etc.) will probe every decision made in these fixes. Prepare written answers to these questions as part of the audit package:"));
children.push(gap(60));
children.push(bullet("Why is the MTID preimage built from those specific fields? What prevents an attacker from predicting and front-running a valid MTID?"));
children.push(bullet("Why is the labor advance rate capped at 1,000 BPS and not lower? What is the economic rationale for the 300 BPS starting rate?"));
children.push(bullet("Why is the TWAP window 24 hours and not 7 days? What is the tradeoff between manipulation resistance and responsiveness to genuine price moves?"));
children.push(bullet("Why is the RBE threshold 12 consecutive months and not 6 or 24? What is the evidence that 12 months is sufficient to rule out temporary favorable conditions?"));
children.push(bullet("Why is the entity concentration cap 15% and not 10%? At what network size does the cap become binding for legitimate multi-national recyclers?"));
children.push(bullet("What happens to outstanding advances if the DAO votes to dissolve the protocol? Is there an emergency unwinding procedure?"));
children.push(bullet("The GenesisPool mints MRT without corresponding physical backing — how is this distinguished from the unbacked fiat creation TRMS is designed to replace?"));

children.push(gap(120));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: sp(200, 200),
  children: [new TextRun({ font, text: "— End of TRMS Known Problems to Fix —", size: 20, italics: true, color: C.navyMid })]
}));

// ═════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: C.navyDark },
        paragraph: { spacing: sp(520,180), outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.navyMid },
        paragraph: { spacing: sp(400,140), outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.teal },
        paragraph: { spacing: sp(320,100), outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.navyMid, space: 6 } },
          children: [new TextRun({ font: "Arial", text: "TRMS — Known Problems to Fix  ·  Agent Swarm Implementation Guide", size: 16, color: C.navyMid })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.navyMid, space: 6 } },
          children: [new TextRun({ font: "Arial", text: "Transitional Resource Monetary System  ·  Confidential Remediation Specification  ·  May 2026", size: 16, color: "888888" })]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/TRMS_Known_Problems_to_Fix.docx', buf);
  console.log('Done. File written.');
});

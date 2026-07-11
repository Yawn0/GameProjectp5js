# OWASP Secure Coding Compliance Report

**Target Project:** Blobby Adventure (Client-Side p5.js Platformer)  
**Reference Standards:** OWASP Secure Coding Practices (SCP) Quick Reference Guide v2.1  

---

## Introduction
This report evaluates the security architecture of the client-side game project *Blobby Adventure*, a side-scrolling platformer built with p5.js and ES modules. Drawing from the **OWASP Secure Coding Practices (SCP) Quick Reference Guide v2.1**, this assessment selects five security guidelines relevant to the game's execution model. It explains how secure programming techniques, validation routines, and testing methodologies studied in the **CM2010 Software Design and Development** course can be leveraged to verify compliance and mitigate runtime issues.

---

## Analysis of 5 Selected OWASP SCP Guidelines

### Guideline 1: [12] Validate Data Range (Input Validation)
* **Relevance to Project:** The game utilizes procedural algorithms to construct its environment and physics variables. For instance, in [generation.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/generation.js), the world width multiplier is dynamically randomized at startup. Unvalidated parameters—such as negative scores, invalid gravity values, or coordinates outside boundaries—can corrupt entity arrays, cause rendering glitches, or allow the character to clip through collision bounds.
* **Course Verification Technique:** *Runtime Assertions (Week 9) & Boundary Value Analysis (Week 14)*. Developers can prevent out-of-bounds parameters by inserting runtime assertions at mutation boundaries. Since JavaScript lacks a built-in runtime assertion framework, a custom validation helper can check constraints (e.g., verifying that the randomized `WORLD_WIDTH` fits exactly within `[CANVAS_WIDTH * 2, CANVAS_WIDTH * 5]`). To check compliance, **Boundary Value Analysis (BVA)** in unit testing (Week 14) is applied. Automated test cases should feed boundary variables to coordinates and physics functions to ensure execution logic does not fail.

### Guideline 2: [13] Validate Data Length (Input Validation)
* **Relevance to Project:** During procedural layout generation, [generation.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/generation.js) dynamically populates arrays such as `state.platforms` and `state.worms`. Without validating the length of these data structures, unchecked scale factors could exhaust available browser memory, trigger heap overflows, or cause infinite execution loops (denial of service).
* **Course Verification Technique:** *Defensive Bounding (Week 9) & Automated Stress Testing (Week 14)*. The codebase implements defensive bounding through loops limited by explicit execution counts (e.g., `attempts < MAX_ATTEMPTS` in random generation functions). Compliance can be verified using **White Box Testing** (Week 14) to assert that array sizes conform to strict density rules. Developers can write integration tests to check that entity counts never exceed system allocations under extreme world scales.

### Guideline 3: Restrict Operations to Buffer Bounds (Memory Management)
* **Relevance to Project:** While JavaScript features automated memory management (preventing raw memory buffer overflows seen in languages like C++), accessing indices outside the boundaries of game state arrays returns `undefined`. Attempting to read properties of an `undefined` element triggers a unhandled `TypeError`, which halts the p5.js frame loop and crashes the game.
* **Course Verification Technique:** *Defensive Coding & Exception Handling (Weeks 9 & 11) & Unit Testing (Weeks 5-8)*. Developers can establish defensive boundary checks (e.g., `if (arr[i] !== undefined)`) before querying indexes inside collision loops. Compliance is checked via **Unit Testing** (Weeks 5-8), writing test cases that target empty lists, out-of-bound indexes, and boundaries to verify that lookups fail-safe. If an error is unavoidable, structured exception handling (`try-catch` blocks) should catch the crash and reset state safely.

### Guideline 4: Centralize Input Validation Routines (Input Validation)
* **Relevance to Project:** In *Blobby Adventure*, game objects (platforms, canyons, collectibles) are constructed across multiple loops using randomized variables. Scattering validation criteria across every generator routine leads to duplication, high module coupling, and an increased risk of missing critical validation checks.
* **Course Verification Technique:** *The Factory Pattern (Weeks 1 & 13) & Static Analysis Code Reviews (Week 10)*. The codebase centralizes object creation by utilizing the **Factory Pattern** via a single exported `factory` object in [entities.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/entities.js). Centralized input validation is achieved by embedding range and type validations directly into the factory constructor methods (e.g., checking that platform dimensions are positive numbers before instantiating). Developers can verify compliance during **Static Code Reviews** (Week 10) to guarantee that direct constructor calls are prohibited outside the factory.

### Guideline 5: Manage Risk of Using Third-Party Components (System Configuration)
* **Relevance to Project:** The game runs in the browser and imports the external library `p5.js`. Incorporating unverified or outdated scripts introduces the risk of cross-site scripting (XSS), code tampering, or remote execution exploits within the client environment.
* **Course Verification Technique:** *Software Security Development Lifecycle (SDL) Inventory & SCA (Week 10)*. Taught in Microsoft SDL principles, developers must maintain a complete inventory of third-party software. Compliance can be enforced using automated **Software Composition Analysis (SCA)** tools (such as `npm audit` or security linters) to scan external packages. Developers can verify compliance via **Static Analysis Code Reviews** (Week 10) by checking integrity signatures (Subresource Integrity hashes) of libraries in the `libraries/` directory.

---

## Secure SDLC Integration Summary
Implementing security as an intrinsic engineering property requires embedding validation checks into the Software Development Lifecycle (SDLC), as studied in Week 10:
1. **Static Analysis Linting (Week 10):** Run automated scanners to check for risky patterns (such as dynamic execution or unhandled variables) before code is executed.
2. **Unit Testing & TDD (Weeks 5-8):** Write tests to verify validation invariants. In line with Test-Driven Development, validation unit tests must check that illegal parameters are rejected at entity boundaries before drawing.
3. **Automated Integration Testing (Week 14):** Simulate unexpected inputs (such as rapid inputs or collision values) to ensure the runtime fails-safe and does not dump detailed stack traces to the browser console.

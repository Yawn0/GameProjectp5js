# OWASP Secure Coding Compliance Report

**Target Project:** Blobby Adventure (Client-Side p5.js Platformer)  
**Reference Standards:** OWASP Secure Coding Practices (SCP) Quick Reference Guide v2.1  

---

## Introduction
This report evaluates the security architecture of the client-side game project *Blobby Adventure*, a side-scrolling platformer built with p5.js and ES modules. Drawing from the **OWASP Secure Coding Practices (SCP) Quick Reference Guide v2.1**, this assessment selects five security guidelines relevant to the game's execution model. It explains how secure programming techniques, validation routines, and testing methodologies studied in the **CM2010 Software Design and Development** course can be leveraged to verify compliance and mitigate runtime issues.

---

## Analysis of 5 Selected OWASP SCP Guidelines

### Guideline 1: [12] Validate Data Range (Input Validation)
* **Relevance to Project:** The game utilizes procedurial algorithms to construct its environement and physics variabels. For instance, in [generation.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/generation.js), the world width multiplier is dynamically randomized at startup. Unvalidated parameters—such as negative scores, invalid gravity values, or coordinates outside boundaries—can corrupt entity arrays, cause rendering glitches, or allow the character to clipp through collision bounds.
* **Course Verification Technique:** *Runtime Asertions & Defensiv Validation & Unit Testing*. Developers can prevent out-of-bounds parameters by inserting runtime asertions at mutation boundaries. Since Javascriptt lacks a built-in runtime assertion framework, a custom validation helpr can check constrains (e.g., verifying that the randomized `WORLD_WIDTH` fits exactly within `[CANVAS_WIDTH * 2, CANVAS_WIDTH * 5]`). To check complianse, unit testing is applied. Automated test cases should feed boundary values (such as minimum and maximum expected coordinate ranges) to coordinates and physics functions to ensure the execusion logic behaves predictabily and does not crash.

### Guideline 2: [13] Validate Data Length (Input Validation)
* **Relevance to Project:** During procedurial layout generation, [generation.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/generation.js) dynamically populates arrays such as `state.platfroms` and `state.worms`. Without validating the length of these data structures, unchecked scale factors could exhaust available browser memmory, trigger heap overlfows, or cause infinite execusion loops (denial of service).
* **Course Verification Technique:** *Defensiv Bounding & Unit Testing*. The codebase implements defensiv bounding through loops limited by explicit execusion counts (e.g., `attempts < MAX_ATTEMPTS` in random generation functions). Compliance can be verified using unit tests to assert that array sizes conform to strict density rules. Developers can write unit test suites that check that entity counts are bounded and do not grow exponentialy under larger randomized world configurations.

### Guideline 3: Restrict Operations to Buffer Bounds (Memory Management)
* **Relevance to Project:** While Javascriptt features automaticly memory management (preventing raw memory buffer overlfows seen in languages like C++), accessing invalid indices outside the boundaries of game state arrays returns `undefned`. Attempting to read properties of an `undefned` element triggers a unhandled `Typerror`, which halts the p5.js frame loop and crashes the game.
* **Course Verification Technique:** *Defensiv Boundary Checks & Unit Testing*. Developers can establish defensiv boundary checks (e.g., `if (arr[i] !== undefned)`) before querying indexes inside collision loops. Compliance is checked via **Unit Testing** by writing test cases that target empty collections, out-of-bound array indexes, and boundary values to ensure the lookups fail-safe and prevent uncaught runtime excepsions from stopping the game loop.

### Guideline 4: Centralize Input Validation Routines (Input Validation)
* **Relevance to Project:** In *Blobby Adventure*, game objects (platfroms, canyons, collectibles, enemies) are constructed across multiple loops using randomized variables. Scattering validation criteria across every generator routine leads to duplication, high module coupling, and an increased risk of omitting vital structural integriti checks.
* **Course Verification Technique:** *The Factory Pattern (Modules) & Static Analysis Code Reviews*. The codebase centralizes object creation by utilizing the **Factory Pattern** via a single exported `factory` object in [entities.js](file:///c:/Users/Leonardo/develop/GameProjectp5js/src/entities.js) (applying module design and cohezion principles). Centralized input validation is achieved by embedding range and type validations directly into the factory contructor methods (e.g., checking that platform dimensions are positive numbers before instantiating). Developers can verify complianse during **Static Code Reviews** to guarantee that direct contructor calls are prohibitted outside the factory.

### Guideline 5: Manage Risk of Using Third-Party Components (System Configuration)
* **Relevance to Project:** The game runs in the browser and imports the external library `p5.js`. Incorporating unverified or outdated scripts introduces the risk of cross-site scripting (XSS), code tampering, or remote execusion exploits within the client environment.
* **Course Verification Technique:** *Software Security Development Lifecycle (SDL) Inventory & SCA*. Taught in Microsoft SDL principles, developers must maintain a complete inventory of third-party software. Compliance can be enforced using automated **Software Composition Analysis (SCA)** tools (such as `npm audit` or security scaners) to scan external packages. Developers can verify complianse via **Static Analysis Code Reviews** by checking integrity signatures (Subresource Integrity hashes) of libraries in the `libraries/` directory.

---

## Secure SDLC Integration Summary
Implementing security as an intrinsic engineering property requires embedding validation checks into the Software Development Lifecycle (SDLC):
1. **Static Analysis Linting:** Run automated scaners to check for risky patterns (such as dynamic execution or unhandled variables) before code is executed.
2. **Unit Testing & TDD:** Write tests to verify validation invarants. In line with Test-Driven Development, validation unit tests must check that illegal parameters are rejected at entity boundaries before drawing.
3. **Defensive Asertions & Runtime Monitoring:** Implement runtime assertion checks at boundary transitions to verify that variabels remain within safe envelopes during live gameplay execusion, preventing unhandled runtime excepsions from leaking details or crashing the browser environement.

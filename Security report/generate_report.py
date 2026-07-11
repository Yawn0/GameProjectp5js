import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfgen import canvas

# Canvas class to draw headers, footers, and dynamic page numbering "Page X of Y"
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1A365D"))
        
        # We don't draw headers/footers on page 1 (cover page)
        if self._pageNumber == 1:
            self.restoreState()
            return

        # Running Header
        self.drawString(54, 750, "OWASP SECURE CODING COMPLIANCE REPORT")
        self.drawRightString(612 - 54, 750, "CM2010 SOFTWARE DESIGN & DEVELOPMENT")
        self.setStrokeColor(colors.HexColor("#1A365D"))
        self.setLineWidth(1)
        self.line(54, 742, 612 - 54, 742)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4A5568"))
        self.drawString(54, 36, "Project: Blobby Adventure (p5.js)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, page_text)
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def create_pdf(filename):
    # Setup document geometry: standard Letter page with 0.75-inch (54 points) margins
    # Printable area width = 612 - 54*2 = 504 points
    # Top margin is expanded to 72 points to clear the running header
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # Define color palette
    primary_color = colors.HexColor("#1A365D")   # Deep navy
    secondary_color = colors.HexColor("#2B6CB0") # Steel blue
    text_color = colors.HexColor("#2D3748")      # Charcoal
    bg_light = colors.HexColor("#F7FAFC")        # Soft white-gray

    # Configure custom typography
    styles['Normal'].textColor = text_color
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=15,
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=40,
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=secondary_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )

    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color
    )

    meta_val_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_color
    )

    story = []

    # ================= PAGE 1: COVER PAGE =================
    story.append(Spacer(1, 100))
    story.append(Paragraph("OWASP Secure Coding Compliance Report", title_style))
    story.append(Paragraph("Evaluating Game Security via Academic Software Design Methodologies", subtitle_style))
    story.append(Spacer(1, 40))

    # Metadata box using Table
    meta_data = [
        [Paragraph("Course Context:", meta_label_style), Paragraph("CM2010 Software Design and Development", meta_val_style)],
        [Paragraph("Target Project:", meta_label_style), Paragraph("Blobby Adventure (Client-Side p5.js Platformer)", meta_val_style)],
        [Paragraph("Source Files:", meta_label_style), Paragraph(
            "<a href='file:///c:/Users/Leonardo/develop/GameProjectp5js/src/main.js'>main.js</a>, "
            "<a href='file:///c:/Users/Leonardo/develop/GameProjectp5js/src/gameplay.js'>gameplay.js</a>, "
            "<a href='file:///c:/Users/Leonardo/develop/GameProjectp5js/src/entities.js'>entities.js</a>, "
            "<a href='file:///c:/Users/Leonardo/develop/GameProjectp5js/src/constants.js'>constants.js</a>, "
            "<a href='file:///c:/Users/Leonardo/develop/GameProjectp5js/src/generation.js'>generation.js</a>",
            meta_val_style
        )],
        [Paragraph("Reference Standards:", meta_label_style), Paragraph("OWASP Secure Coding Practices Quick Reference Guide v2.1", meta_val_style)]
    ]
    meta_table = Table(meta_data, colWidths=[130, 374])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor("#E2E8F0")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E0")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 100))

    # Exec Summary / Context Intro
    intro_p = (
        "<b>Executive Summary:</b> This report analyzes the security architecture of the client-side game project "
        "<i>Blobby Adventure</i>. Using the <b>OWASP Secure Coding Practices (SCP) Quick Reference Guide v2.1</b>, "
        "i select five security items relevant to the game's execution context. I then explain how the secure "
        "programming techniques and engineering principles tught in the <b>CM2010</b> course can be applied to ensure secure code."
    )
    story.append(Paragraph(intro_p, styles['Normal']))
    story.append(PageBreak())

    # ================= PAGE 2: SECURITY COMPLIANCE ANALYSIS =================
    story.append(Paragraph("1. Selection & Analysis of OWASP Secure Coding Items", h1_style))
    story.append(Spacer(1, 6))

    # --- ITEM 1 ---
    story.append(Paragraph("Item 1: [12] Validate Data Range (Input Validation)", h2_style))
    story.append(Paragraph(
        "• <b>Relevance to Project:</b> The game relies heavily on procedural coordinate layouts and physics simulations. "
        "For example, in generation.js, the world width scale is dynamically randomized. "
        "Unvalidated variables (negative scores, out-of-bounds values, etc.) could cause various problems "
        "(e.g. corrupt state, infinite loops, etc.).",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Course Verification Technique:</b> <i>Runtime Assertions (Week 9) & Boundary Value Analysis (Week 14)</i>. "
        "We can enforce constraints by placing assertions. Although JavaScript has no native "
        "runtime assert, a helpr function can check constraints (e.g., verifying that the randomized <code>WORLD_WIDTH</code> "
        "falls within <code>[CANVAS_WIDTH * 2, CANVAS_WIDTH * 5]</code>). For testing compliance, <b>Boundary Value Analysis (BVA)</b> "
        "in unit testing (Week 14) should be used. Automated test suites should simulate boundary values for input variables "
        "to ensurephysics engine handles edge conditions without failure.",
        bullet_style
    ))
    story.append(Spacer(1, 8))

    # --- ITEM 2 ---
    story.append(Paragraph("Item 2: [13] Validate Data Length (Input Validation)", h2_style))
    story.append(Paragraph(
        "• <b>Relevance to Project:</b> During level generation in generation.js, "
        "the engine dynamically populates collections such as <code>state.platforms</code> or <code>state.worms</code>. "
        "Without strict validations, scaling parameters could exhaust available memory space or cause "
        "excessive rendering overhead.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Course Verification Technique:</b> <i>Defensive Bounding (Week 9) & Automated Stress Testing (Week 14)</i>. "
        "The codebase uses a defensive technique by bounding iterative random placement within attempt limits (e.g., <code>attempts < MAX_ATTEMPTS</code>). "
        "Compliance is checked through <b>White Box Testing</b> (Week 14) to verify that generated collection sizes conform to density constraints. "
        "Automated black box scripts can simulate prolonged gameplay runs to verify that the entity arrays stay bounded and memory usage "
        "remain stable over time.",
        bullet_style
    ))
    story.append(Spacer(1, 8))

    # --- ITEM 3 ---
    story.append(Paragraph("Item 3: Restrict Operations to Buffer Bounds (Memory Management)", h2_style))
    story.append(Paragraph(
        "• <b>Relevance to Project:</b> JavaScript manages memory automatically, avoiding typical low-level C/C++ memory overflows. "
        "However, accessing invalid indices (e.g., referencing an index out of bounds) "
        "returns <code>undefined</code>. Dereferencing properties on an <code>undefined</code> element will throw a TypeError, crashing the game.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Course Verification Technique:</b> <i>Defensive Coding & Exception Handling (Weeks 9 & 11) & Unit Testing (Weeks 5-8)</i>. "
        "I could implement defensive checks at indexing boundaries to guarantee element existence before member access. "
        "To check compliance, unit tests must cover edge inputs: so writing test cases that query empty collections, "
        "verif=ing behavior when accessing elements past array boundaries and confirming that functions handle missing indices gracefully. "
        "If a lookup fails, structured exception handling (using <code>try-catch</code>) can prevent the application from crashing.",
        bullet_style
    ))
    story.append(Spacer(1, 8))

    # --- ITEM 4 ---
    story.append(Paragraph("Item 4: Centralize Input Validation Routines (Input Validation)", h2_style))
    story.append(Paragraph(
        "• <b>Relevance to Project:</b> <i>Blobby Adventure</i> generates game entities (platforms, canyons, collectibles, enemies) "
        "using separate coordinate layout rules. Validating dimensions and safety zones in each generation function "
        "increases coupling and duplication, which heightens` the risk of omitting integrity checks.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Course Verification Technique:</b> <i>The Factory Pattern (Weeks 1 & 13) & Static Analysis Code Reviews (Week 10)</i>. "
        "The project decouples object construction via the <b>Factory Pattern</b> using a centralized <code>factory</code> object in "
        "entities.js. Compliance with centralized validation "
        "is achieved by embedding verification rules directly into the factory methods. "
        "Compliance can be checked via <b>Code Reviews / Static Analysis</b> (Week 10) to verify that raw <code>new</code> constructor calls "
        "are prohibited outside <code>entities.js</code>, enforcing the centralized validation structure.",
        bullet_style
    ))

    # ================= PAGE 3: ITEM 5 & SDLC INTEGRATION =================
    story.append(Paragraph("Item 5: Manage Risk of Using Third-Party Components (System Configuration)", h2_style))
    story.append(Paragraph(
        "• <b>Relevance to Project:</b> The game relies on the external framework library <code>p5.js</code>. "
        "Using outdated or modified third-party packages exposes the client to security risks, cross-site scripting (XSS), "
        "or remote code execution in the user's browser.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Course Verification Technique:</b> <i>Software Security Development Lifecycle (SDL) Inventory & SCA (Week 10)</i>. "
        "As covered in Microsoft SDL principles, secure projects must establish a complete inventory of external resources. "
        "Compliance is checked via automated <b>Software Composition Analysis (SCA)</b> and dependency vulnerability scanners "
        "(e.g., <code>npm audit</code>). Furthermore, we can use <b>Static Code Reviews</b> (Week 10).",
        bullet_style
    ))
    story.append(Spacer(1, 15))

    story.append(Paragraph("2. Secure Software Development Lifecycle (SDLC) Integration", h1_style))
    story.append(Paragraph(
        "Integrating secure programming practices into the development lifecycle ensures security is intrinsic to the software, rather than an afterthought. "
        "As examined in Week 10, we can integrate these practices using three distinct phases of the Software Security Development Lifecycle:",
        styles['Normal']
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "1. <b>Static Analysis (Security Linting):</b> During the coding phase, automated static analysis tools (similar to "
        "Bandit for Python, but targeting JavaScript, such as ESLint with security plugins) should be run. These tools inspect "
        "source files to identify vulnerable coding patterns before compile or run time.",
        bullet_style
    ))
    story.append(Paragraph(
        "2. <b>Unit Testing and Test-Driven Development (TDD):</b> Unit testing (Weeks 5-8) should be utilized to construct "
        "a regression test suite. Following TDD, test assertions should be written to verify validation rules before functional "
        "logic is written,.",
        bullet_style
    ))
    story.append(Paragraph(
        "3. <b>Automated Black Box / Integration Testing in Games:</b> Following the testing methodologies of Week 14, automated "
        "black box scripts should simulate random keyboard and mouse inputs "
        "to verify robustness. The automated system checks that the client does not crash or expose raw console error traces to the user, "
        "fulfilling the principle of safe defaults and secure error handling.",
        bullet_style
    ))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    create_pdf("OWASP_Security_Report.pdf")
    print("PDF report successfully created as OWASP_Security_Report.pdf")

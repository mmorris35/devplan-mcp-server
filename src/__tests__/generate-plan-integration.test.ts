import { describe, it, expect } from "vitest";
import { generatePlan } from "../generators";

describe("Mermaid diagram injection", () => {
	it("should inject Mermaid diagrams into CLI plan subtask 0.1.1", () => {
		const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: md2pdf
- **Project Type**: cli
- **Primary Goal**: Convert markdown to PDF
- **Target Users**: Developers, writers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Convert markdown files to PDF
- Validate markdown syntax
- Export with custom styles

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Python 3.11+
- Click

### Cannot Use

- (none specified)
`;

		const plan = generatePlan(brief);

		// Should contain Mermaid diagrams section in subtask 0.1.1
		expect(plan).toContain("Starter Mermaid Diagrams");
		expect(plan).toContain("```mermaid");
		expect(plan).toContain("flowchart");
		// Should have architecture diagram
		expect(plan).toContain("Architecture Overview:");
		// Should have CLI command tree for CLI projects
		expect(plan).toContain("Command Structure:");
	});

	it("should inject Mermaid diagrams into API plan subtask 0.1.1", () => {
		const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: user-api
- **Project Type**: api
- **Primary Goal**: User management API
- **Target Users**: API consumers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- List users endpoint
- Create user endpoint
- Delete user endpoint

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Python 3.11+
- FastAPI

### Cannot Use

- (none specified)
`;

		const plan = generatePlan(brief);

		// Should contain Mermaid diagrams
		expect(plan).toContain("Starter Mermaid Diagrams");
		expect(plan).toContain("```mermaid");
		// Should have architecture diagram
		expect(plan).toContain("Architecture Overview:");
		// Should have API endpoints diagram for API projects
		expect(plan).toContain("API Endpoints:");
	});

	it("should inject Mermaid diagrams into web_app plan subtask 0.1.1", () => {
		const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: dashboard-app
- **Project Type**: web_app
- **Primary Goal**: Analytics dashboard
- **Target Users**: Business users
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Home page with overview
- Settings page
- Dashboard page with charts

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- TypeScript
- Next.js

### Cannot Use

- (none specified)
`;

		const plan = generatePlan(brief);

		// Should contain Mermaid diagrams
		expect(plan).toContain("Starter Mermaid Diagrams");
		expect(plan).toContain("```mermaid");
		// Should have architecture diagram
		expect(plan).toContain("Architecture Overview:");
		// Should have page flow diagram for web_app projects
		expect(plan).toContain("Page Flow:");
	});

	it("should inject Mermaid diagrams into library plan subtask 0.1.1", () => {
		const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: data-validator
- **Project Type**: library
- **Primary Goal**: Data validation library
- **Target Users**: Python developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Validator module for schema validation
- Parser class for data parsing

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Python 3.11+
- pytest

### Cannot Use

- (none specified)
`;

		const plan = generatePlan(brief);

		// Should contain Mermaid diagrams
		expect(plan).toContain("Starter Mermaid Diagrams");
		expect(plan).toContain("```mermaid");
		// Should have architecture diagram
		expect(plan).toContain("Architecture Overview:");
		// Should have module structure diagram for library projects
		expect(plan).toContain("Module Structure:");
	});

	it("should inject diagrams into minimal scaffold for unsupported language", () => {
		const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: go-tool
- **Project Type**: cli
- **Primary Goal**: Go CLI tool
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Build command that builds projects
- Deploy command that deploys

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Go
- Cobra

### Cannot Use

- (none specified)
`;

		const plan = generatePlan(brief);

		// Should use minimal scaffold
		expect(plan).toContain("No specific template for");
		// Should still contain Mermaid diagrams
		expect(plan).toContain("Starter Mermaid Diagrams");
		expect(plan).toContain("```mermaid");
		expect(plan).toContain("flowchart");
	});
});

describe("generatePlan integration", () => {
	describe("existing templates (should use specific templates)", () => {
		it("should generate Python CLI scaffold for Python CLI project", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: test-cli
- **Project Type**: cli
- **Primary Goal**: A test CLI tool
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Hello command that prints hello

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Python 3.11+
- Click
- pytest

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// Should use Python CLI template (specific template exists)
			expect(plan).toContain("# test-cli - Development Plan");
			expect(plan).toContain("Python");
			expect(plan).toContain("pyproject.toml");
			// Should NOT have the "no specific template" note
			expect(plan).not.toContain("No specific template for");
		});

		it("should generate TypeScript web_app scaffold for TypeScript web_app project", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: test-webapp
- **Project Type**: web_app
- **Primary Goal**: A test web app
- **Target Users**: End users
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Home page that displays home

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- TypeScript
- Next.js
- Jest

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// Should use web_app template (specific template exists for TS web_app)
			expect(plan).toContain("# test-webapp - Development Plan");
			expect(plan).toContain("TypeScript");
			// Should NOT have the "no specific template" note
			expect(plan).not.toContain("No specific template for");
		});
	});

	describe("minimal scaffolds (no specific template)", () => {
		it("should generate TypeScript CLI scaffold with minimal template", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: ts-cli
- **Project Type**: cli
- **Primary Goal**: A TypeScript CLI tool
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Parse command that parses files

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- TypeScript
- Commander
- vitest

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// Should use minimal scaffold (no TypeScript CLI template)
			expect(plan).toContain("# ts-cli - Development Plan");
			expect(plan).toContain("No specific template for");
			expect(plan).toContain("cli:typescript");
			// Should have TypeScript-specific content
			expect(plan).toContain("node_modules");
			expect(plan).toContain(".ts");
		});

		it("should generate static site scaffold for HTML/CSS project", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: landing-page
- **Project Type**: web_app
- **Primary Goal**: A static landing page
- **Target Users**: Website visitors
- **Timeline**: 1 week
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Hero section that displays hero
- Contact form for static form

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- HTML
- CSS

### Cannot Use

- (none specified)

## Other Constraints

- No backend
- Static only
`;

			const plan = generatePlan(brief);

			// Should use minimal scaffold with static variant
			expect(plan).toContain("# landing-page - Development Plan");
			expect(plan).toContain("No specific template for");
			// Should have static-specific content
			expect(plan).toContain("index.html");
			expect(plan).toContain("css");
		});

		it("should generate Go API scaffold", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: go-api
- **Project Type**: api
- **Primary Goal**: A Go REST API
- **Target Users**: API consumers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Health endpoint that returns status

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Go
- Chi
- go test

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// Should use minimal scaffold (no Go API template)
			expect(plan).toContain("# go-api - Development Plan");
			expect(plan).toContain("No specific template for");
			expect(plan).toContain("api:go");
			// Should have Go-specific content
			expect(plan).toContain("go.mod");
			expect(plan).toContain(".go");
		});

		it("should generate unknown language scaffold gracefully", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: rust-tool
- **Project Type**: cli
- **Primary Goal**: A Rust CLI tool
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Process files command that processes input

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- Rust
- Clap
- cargo test

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// Should use minimal scaffold with unknown fallback
			expect(plan).toContain("# rust-tool - Development Plan");
			expect(plan).toContain("No specific template for");
			// Should still generate valid plan structure
			expect(plan).toContain("## Phase 0: Foundation");
			expect(plan).toContain("## Phase 1:");
		});
	});

	describe("regression tests", () => {
		it("should NOT default to Python CLI for TypeScript CLI (issue #80)", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: my-ts-cli
- **Project Type**: cli
- **Primary Goal**: TypeScript CLI
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Main command

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- TypeScript

### Cannot Use

- (none specified)
`;

			const plan = generatePlan(brief);

			// MUST NOT contain Python-specific content
			expect(plan).not.toContain("pyproject.toml");
			expect(plan).not.toContain("__pycache__");
			expect(plan).not.toContain("pip install");
			expect(plan).not.toContain("pytest");

			// Should contain TypeScript content
			expect(plan).toContain("TypeScript");
		});

		it("should NOT default to Next.js for static HTML site (issue #59 variant)", () => {
			const brief = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: simple-site
- **Project Type**: web_app
- **Primary Goal**: Simple static site
- **Target Users**: Website visitors
- **Timeline**: 1 week
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- Home page

### Nice-to-Have Features (v2)

- (to be determined after MVP)

## Technical Constraints

### Must Use

- HTML

### Cannot Use

- JavaScript frameworks
- React
- Next.js

## Other Constraints

- Static site
- No JavaScript framework
`;

			const plan = generatePlan(brief);

			// MUST NOT contain Next.js/React content
			expect(plan).not.toContain("npx create-next-app");
			expect(plan).not.toContain("React");
			expect(plan).not.toContain("Prisma");

			// Should contain static site content
			expect(plan).toContain("index.html");
		});
	});
});

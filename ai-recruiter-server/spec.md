====================================================================
PROJECT NAME
====================================================================

AI Recruitment Organization

====================================================================
PROJECT TYPE
====================================================================

Spec-Driven Multi-Agent Recruitment Platform

====================================================================
PRIMARY OBJECTIVE
====================================================================

Build an enterprise-style recruitment ecosystem where:

1. Recruiters create jobs and hiring specifications
2. Candidates apply through public application pages
3. AI agents analyze resumes automatically
4. AI workflows execute autonomously
5. Recruiters approve/reject AI decisions
6. RAG provides organizational intelligence
7. Workflow execution is visualized graphically

IMPORTANT:
This is NOT a chatbot project.

This IS:
- workflow orchestration
- AI automation
- RAG system
- ATS platform
- multi-agent system
- spec-driven architecture

====================================================================
IMPORTANT PROJECT STRUCTURE UPDATE
====================================================================

THE PROJECT ROOT ALREADY CONTAINS:

- client/
- server/

DO NOT CREATE:
- frontend/
- backend/

USE THE EXISTING STRUCTURE ONLY.

====================================================================
CORE ARCHITECTURAL PRINCIPLE
====================================================================

ALL BUSINESS LOGIC MUST BE SPEC-DRIVEN.

NEVER hardcode:
- hiring thresholds
- workflow steps
- scoring logic
- retry policies
- prompt templates
- evaluation rules



====================================================================
FINAL TECH STACK
====================================================================

FRONTEND
---------
Framework:
- Next.js 15 App Router

Language:
- JavaScript

Styling:
- Tailwind CSS
- shadcn/ui

State Management:
- Zustand

Forms:
- React Hook Form
- Zod

Workflow Visualization:
- React Flow

--------------------------------------------------

BACKEND
--------
Framework:
- Express.js

Runtime:
- Node.js 20+

Validation:
- Zod

Architecture:
- Modular Express Architecture

--------------------------------------------------

DATABASE
---------
Primary DB:
- MongoDB

ODM:
- Mongoose

--------------------------------------------------

VECTOR DATABASE
----------------
- Qdrant

--------------------------------------------------

AI STACK
---------
Workflow Orchestration:
- LangGraph

LLM Framework:
- LangChain

Embedding Model:
- BAAI/bge-small-en-v1.5

LLM Provider:
- Groq API Free Tier

Fallback LLM:
- OpenRouter Free Models

--------------------------------------------------

EMAIL
------
- Resend Free Tier

--------------------------------------------------

TESTING
--------
- Jest
- Supertest
- Playwright

====================================================================
LOCAL DEVELOPMENT REQUIREMENTS
====================================================================

REQUIRED SOFTWARE
-----------------
- Node.js
- MongoDB
- Docker (Recommended)
- Git
- VS Code

MINIMUM SYSTEM
--------------
- 8GB RAM
- i5/Ryzen 5

RUNNING PORTS
-------------
Frontend:
localhost:3000

Backend:
localhost:5000

MongoDB:
localhost:27017

Qdrant:
localhost:6333

====================================================================
FINAL PROJECT STRUCTURE
====================================================================

ai-recruitment-platform/
│
├── client/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── auth/
│   │   └── apply/
│   │
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── store/
│   ├── lib/
│   ├── public/
│   └── styles/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── agents/
│   │   ├── workflows/
│   │   ├── rag/
│   │   ├── analytics/
│   │   ├── emails/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── constants/
│   │
│   ├── uploads/
│   ├── logs/
│   └── tests/
│
├── specs/
│   ├── hiring/
│   ├── workflow/
│   ├── evaluation/
│   ├── prompts/
│   ├── email/
│   └── system/
│
├── docker/
├── docs/
├── scripts/
├── docker-compose.yml
├── README.md
└── .env

====================================================================
MANDATORY IMPLEMENTATION RULES
====================================================================

CLIENT FOLDER
--------------
The ENTIRE frontend application MUST be implemented ONLY inside:

    /client

This includes:
- Next.js app
- pages/routes
- UI components
- React Flow visualization
- Zustand store
- Tailwind setup
- shadcn/ui
- frontend API calls
- forms
- authentication UI
- recruiter dashboard
- public candidate application pages

--------------------------------------------------

SERVER FOLDER
--------------
The ENTIRE backend application MUST be implemented ONLY inside:

    /server

This includes:
- Express.js server
- APIs
- AI agents
- LangGraph workflows
- RAG implementation
- Qdrant integration
- MongoDB integration
- Mongoose models
- authentication
- file uploads
- retry logic
- workflow persistence
- logging
- email service

--------------------------------------------------

STRICT RULES
------------

1. NEVER create additional frontend/backend root folders.
2. ALWAYS use:
       /client
       /server

3. ALL frontend code MUST remain inside:
       /client

4. ALL backend code MUST remain inside:
       /server

5. Shared specs MUST remain inside:
       /specs

6. Resume uploads MUST be stored inside:
       /server/uploads

7. Workflow logs MUST be stored inside:
       /server/logs

8. Mongoose models MUST exist inside:
       /server/src/models

====================================================================
HOW THE SYSTEM WORKS
====================================================================

--------------------------------------------------
RECRUITER FLOW
--------------------------------------------------

1. Recruiter logs in
2. Recruiter creates job
3. Recruiter defines hiring specification
4. System generates public application route
5. Recruiter monitors workflows
6. Recruiter approves/rejects candidates

--------------------------------------------------
CANDIDATE FLOW
--------------------------------------------------

1. Candidate opens public apply route
2. Candidate uploads resume
3. AI workflow automatically starts
4. Candidate application gets processed

--------------------------------------------------
AI FLOW
--------------------------------------------------

Resume Upload
      ↓
Resume Parser Agent
      ↓
Embedding Agent
      ↓
Qdrant Vector Storage
      ↓
Matching Agent
      ↓
Shortlisting Agent
      ↓
Human Approval
      ↓
Interview Agent
      ↓
Email Agent
      ↓
Workflow Completed

====================================================================
FINAL MVP FEATURES
====================================================================

AUTHENTICATION
---------------
- signup
- login
- JWT auth
- role-based access

RECRUITER DASHBOARD
-------------------
- create jobs
- manage jobs
- view candidates
- workflow monitoring
- analytics

CANDIDATE PORTAL
----------------
- public application page
- resume upload
- application submission

AI AGENTS
----------
- Resume Parser Agent
- Embedding Agent
- Matching Agent
- Shortlisting Agent
- Interview Agent
- Email Agent

RAG SYSTEM
-----------
- embeddings
- semantic search
- hiring policy retrieval
- resume retrieval

WORKFLOW ENGINE
---------------
- LangGraph orchestration
- retries
- checkpoints
- resumability
- state persistence

VISUALIZATION
--------------
- workflow graph
- node states
- retries
- failures
- execution logs

ANALYTICS
----------
- candidate statistics
- shortlist rate
- workflow completion rate
- agent execution metrics

====================================================================
REQUIRED FRONTEND ROUTES
====================================================================

AUTH ROUTES
------------
/login
/signup

--------------------------------------------------

RECRUITER ROUTES
-----------------
/dashboard
/dashboard/jobs
/dashboard/jobs/create
/dashboard/candidates
/dashboard/workflows
/dashboard/analytics

--------------------------------------------------

PUBLIC CANDIDATE ROUTES
------------------------
/jobs/[jobId]
/jobs/[jobId]/apply

IMPORTANT:
Candidate routes MUST be public.
Recruiter authentication NOT required.

====================================================================
DATABASE COLLECTIONS
====================================================================

COLLECTION: users
------------------
Fields:
- id
- name
- email
- password
- role
- created_at

--------------------------------------------------

COLLECTION: jobs
-----------------
Fields:
- id
- title
- description
- required_skills
- preferred_skills
- min_experience
- workflow_spec_id
- created_at

--------------------------------------------------

COLLECTION: candidates
-----------------------
Fields:
- id
- name
- email
- phone
- resume_url
- parsed_resume_json
- match_score
- status
- created_at

--------------------------------------------------

COLLECTION: workflows
----------------------
Fields:
- id
- candidate_id
- job_id
- current_state
- status
- created_at

--------------------------------------------------

COLLECTION: workflow_logs
--------------------------
Fields:
- id
- workflow_id
- agent_name
- input
- output
- status
- error
- created_at

====================================================================
SPEC-DRIVEN DEVELOPMENT RULES
====================================================================

IMPORTANT:
NO BUSINESS RULES MAY BE HARDCODED.

ALL RULES MUST COME FROM:
    /specs

--------------------------------------------------

BAD:
if(score > 75)

GOOD:
if(score > hiringSpec.minimum_score)

====================================================================
REQUIRED SPEC FILES
====================================================================

FILE:
    /specs/hiring/frontend-developer.json

{
  "role": "Frontend Developer",
  "required_skills": [
    "React",
    "JavaScript",
    "CSS"
  ],
  "preferred_skills": [
    "Next.js",
    "Tailwind CSS"
  ],
  "minimum_score": 75,
  "interview_rounds": 2
}

--------------------------------------------------

FILE:
    /specs/workflow/default-hiring-workflow.json

{
  "workflow": [
    "resume_parser",
    "embedding_agent",
    "matching_agent",
    "shortlisting_agent",
    "human_approval",
    "interview_agent",
    "email_agent"
  ]
}

--------------------------------------------------

FILE:
    /specs/system/retry-policy.json

{
  "max_retries": 3,
  "retry_delay_ms": 5000
}

====================================================================
AI AGENT SPECIFICATIONS
====================================================================

AGENT 1:
Resume Parser Agent

Purpose:
- parse uploaded resume PDF

Input:
- PDF file

Responsibilities:
- extract skills
- extract experience
- extract education
- extract projects

Output Format:
{
  "success": true,
  "data": {
    "name": "John Doe",
    "skills": ["React", "Node.js"],
    "experience": 3,
    "education": "B.Tech"
  }
}

--------------------------------------------------

AGENT 2:
Embedding Agent

Purpose:
- generate embeddings
- store embeddings in Qdrant

Stores:
- resumes
- hiring policies
- evaluation docs

--------------------------------------------------

AGENT 3:
Matching Agent

Purpose:
- compare candidate with hiring spec

Input:
- parsed resume
- hiring spec
- retrieved RAG context

Output:
{
  "success": true,
  "data": {
    "match_score": 87,
    "missing_skills": ["TypeScript"],
    "recommendation": "Shortlist"
  }
}

--------------------------------------------------

AGENT 4:
Shortlisting Agent

Purpose:
- final AI decision engine

Rules:
>= 80 → shortlist
60-79 → hold
< 60 → reject

IMPORTANT:
Thresholds MUST come dynamically from /specs.
NEVER hardcode thresholds.

--------------------------------------------------

AGENT 5:
Interview Agent

Purpose:
- generate interview questions
- generate coding tasks
- generate evaluation rubrics

--------------------------------------------------

AGENT 6:
Email Agent

Purpose:
- send interview emails
- send rejection emails
- send reminders

====================================================================
RAG IMPLEMENTATION SPEC
====================================================================

RAG PURPOSE
------------
Provide organizational intelligence to AI agents.

DATA SOURCES
-------------
- resumes
- hiring policies
- evaluation docs
- interview guidelines

--------------------------------------------------

RAG PIPELINE
-------------

Documents
    ↓
Chunking
    ↓
Embeddings
    ↓
Qdrant Storage
    ↓
Similarity Search
    ↓
Context Injection
    ↓
LLM Response

--------------------------------------------------

CHUNKING RULES
---------------

Resume chunks:
- 500 chars

Policy chunks:
- 1000 chars

--------------------------------------------------

SIMILARITY SEARCH
------------------

Top K:
- 5

Minimum similarity:
- 0.75

====================================================================
LANGGRAPH WORKFLOW SPEC
====================================================================

MAIN WORKFLOW
--------------

Resume Upload
      ↓
Resume Parser Agent
      ↓
Embedding Agent
      ↓
Matching Agent
      ↓
Shortlisting Agent
      ↓
Human Approval
      ↓
Interview Agent
      ↓
Email Agent
      ↓
Workflow Completed

--------------------------------------------------

LANGGRAPH REQUIREMENTS
----------------------

Must support:
- retries
- checkpoints
- resumability
- state persistence
- branching
- human approval pauses

====================================================================
WORKFLOW VISUALIZATION SPEC
====================================================================

Use:
- React Flow

--------------------------------------------------

NODE STATES
------------

Running:
- blue

Success:
- green

Failed:
- red

Waiting Approval:
- yellow

--------------------------------------------------

MUST DISPLAY
------------

- execution order
- active node
- failed nodes
- retries
- approval checkpoints

====================================================================
API REQUIREMENTS
====================================================================

AUTH
-----
POST /auth/signup
POST /auth/login
GET  /auth/me

--------------------------------------------------

JOBS
-----
POST /jobs
GET  /jobs
GET  /jobs/:id
PUT  /jobs/:id

--------------------------------------------------

CANDIDATES
-----------
POST /candidates/upload
GET  /candidates
GET  /candidates/:id

--------------------------------------------------

WORKFLOWS
----------
POST /workflow/start
POST /workflow/retry
POST /workflow/approve
GET  /workflow/:id

====================================================================
SECURITY REQUIREMENTS
====================================================================

MANDATORY SECURITY
-------------------

- JWT auth
- bcryptjs password hashing
- helmet middleware
- rate limiting
- file validation
- input sanitization
- NoSQL injection prevention

====================================================================
TESTING REQUIREMENTS
====================================================================

UNIT TESTS
------------
Test:
- scoring logic
- validators
- helper functions

--------------------------------------------------

AGENT TESTS
------------

Verify:
- valid JSON outputs
- deterministic outputs
- retry handling

--------------------------------------------------

RAG TESTS
-----------

Verify:
- correct retrieval
- semantic relevance
- low hallucination

--------------------------------------------------

WORKFLOW TESTS
---------------

Verify:
- execution order
- retries
- state persistence
- approval pauses

--------------------------------------------------

END-TO-END TEST
----------------

Flow:
Create Job
    ↓
Open Apply Page
    ↓
Upload Resume
    ↓
Run Workflow
    ↓
Shortlist Candidate
    ↓
Send Email

====================================================================
IMPORTANT TESTING UNDERSTANDING
====================================================================

During local development:

YOU simulate ALL actors yourself.

You act as:
- recruiter
- candidate
- HR reviewer
- system tester

--------------------------------------------------
LOCAL TESTING FLOW
--------------------------------------------------

STEP 1:
Open recruiter dashboard

Example:
http://localhost:3000/dashboard

STEP 2:
Create hiring job

STEP 3:
System generates public apply page

Example:
http://localhost:3000/jobs/123/apply

STEP 4:
Open apply page manually

STEP 5:
Upload sample resume yourself

Example:
john-react-resume.pdf

STEP 6:
AI workflow automatically executes

THIS IS HOW PROFESSIONAL MULTI-USER SYSTEMS
ARE TESTED LOCALLY.

====================================================================
FAILURE HANDLING REQUIREMENTS
====================================================================

RETRYABLE FAILURES
-------------------

- LLM timeout
- email API failure
- vector DB timeout

--------------------------------------------------

NON-RETRYABLE FAILURES
-----------------------

- invalid PDF
- malformed JSON
- invalid request schema

--------------------------------------------------

EVERY FAILURE MUST LOG
-----------------------

- agent name
- workflow state
- stack trace
- timestamp

====================================================================
DOCKER REQUIREMENTS
====================================================================

Docker is RECOMMENDED but NOT mandatory.

USE Docker mainly for:
- MongoDB
- Qdrant

--------------------------------------------------

RECOMMENDED DEVELOPMENT FLOW
----------------------------

Docker:
- MongoDB
- Qdrant

Manual:
- client
- server

--------------------------------------------------

QDRANT COMMAND
---------------

docker run -p 6333:6333 qdrant/qdrant

====================================================================
ENVIRONMENT VARIABLES
====================================================================

CLIENT/.env.local
------------------

NEXT_PUBLIC_API_URL=http://localhost:5000

--------------------------------------------------

SERVER/.env
------------

PORT=5000

MONGODB_URI=

JWT_SECRET=

GROQ_API_KEY=

OPENROUTER_API_KEY=

QDRANT_URL=http://localhost:6333

RESEND_API_KEY=

====================================================================
IMPLEMENTATION RULES FOR CODEX
====================================================================

STRICT RULES
-------------

1. USE JavaScript ONLY.
2. DO NOT use TypeScript anywhere.
3. USE Express.js backend ONLY.
4. USE MongoDB + Mongoose ONLY.
5. NEVER create NestJS structure.
6. NEVER create Prisma schema.
7. USE modular Express architecture.
8. ALL frontend code MUST remain inside /client.
9. ALL backend code MUST remain inside /server.
10. NEVER hardcode business logic.
11. ALWAYS read logic from /specs.
12. ALWAYS validate API input schemas.
13. ALWAYS return structured JSON.
14. ALWAYS persist workflow state.
15. ALWAYS support retries.
16. ALWAYS log workflow failures.
17. ALWAYS use deterministic prompts.
18. NEVER tightly couple agents.
19. NEVER skip validation.
20. PUBLIC APPLY ROUTES MUST WORK WITHOUT LOGIN.
21. RECRUITER DASHBOARD MUST REQUIRE AUTH.
22. RESUME UPLOAD MUST AUTOMATICALLY TRIGGER WORKFLOW.
23. ALL AGENT OUTPUTS MUST BE JSON SERIALIZABLE.
24. ALL WORKFLOW STATES MUST BE TRACKABLE.

====================================================================
SUCCESS CRITERIA
====================================================================

PROJECT IS SUCCESSFUL IF:

- recruiter can create jobs
- candidate can apply publicly
- resume uploads successfully
- AI parses resumes correctly
- RAG retrieves relevant knowledge
- workflows execute autonomously
- recruiter can approve AI decisions
- workflow graph visualizes execution
- retries recover failures
- specs control all business logic

====================================================================
FINAL END-TO-END FLOW
====================================================================

Recruiter Creates Job
        ↓
Hiring Spec Loaded
        ↓
System Generates Public Apply Route
        ↓
Candidate Uploads Resume
        ↓
Resume Parser Agent
        ↓
Embedding Agent
        ↓
Qdrant Storage
        ↓
Matching Agent
        ↓
Shortlisting Agent
        ↓
Human Approval
        ↓
Interview Agent
        ↓
Email Agent
        ↓
Workflow Completed

====================================================================
END OF FINAL IMPLEMENTATION SPEC
====================================================================
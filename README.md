# Onboard Companion

ONBOARDING MENTOR — PRODUCT REDESIGN & REFACTOR



Objective



Redesign and refactor the existing Onboarding Mentor application into an enterprise-ready, AI-powered onboarding and knowledge platform.



Important: This is an enhancement of the existing codebase. First inspect the current application, routes, components, data models, and existing functionality. Reuse working functionality where possible. Do not rebuild unnecessarily or remove existing features without reason.



Priorities:



1. Clean, modern enterprise UX

2. Clear role-based workflows

3. Knowledge → AI Processing → Approval → Learning → AI Mentor → Assessment → Analytics

4. Scalable multi-team/unit architecture

5. Strong AI governance, RBAC and auditability

6. Responsive and accessible UI



---



1. PRODUCT MODEL



The platform supports onboarding at:



Organisation → Unit → Tribe → Team → Role



Primary users:



- New Joiner / Employee / Intern

- Manager / HR

- SME / Content Owner

- Admin



The platform has 3 core layers:



Knowledge Layer



Documents, videos, policies, SOPs, FAQs, internal websites and training material.



Learning Layer



Modules, personalised journeys, assessments and progress.



Assistance Layer



AI Onboarding Mentor for contextual Q&A and guidance.



---



2. CORE WORKFLOW



Implement the following lifecycle:



Knowledge Source

→ AI Processing

→ AI Suggestions

→ Human Review

→ Approval

→ Published Knowledge

→ Module Creation

→ Personalised Learning Journey

→ New Joiner Learning

→ AI Mentor Assistance

→ Assessment

→ Completion

→ Analytics

→ Feedback / Knowledge Gaps

→ Content Improvement



AI must suggest, while authorised humans approve important organisational content before publication.



---



3. KNOWLEDGE HUB



Create/refine a central Knowledge Hub.



Supported content:



- PDF

- DOC/DOCX

- PPT/PPTX

- XLS/XLSX

- Images/OCR

- Video

- Audio

- Internal websites

- Policies

- SOPs

- FAQs

- Training material



Each knowledge item should support:



- Title

- Type

- Owner

- Team/Unit

- Category

- Tags

- Version

- Status

- Created/updated date

- Last reviewed date

- Review due date

- Source

- Approval status



Statuses:



Draft → AI Processed → Pending Review → Approved → Published → Review Due → Archived



---



4. AI CONTENT PROCESSING



For uploaded content, show AI processing states and results.



AI capabilities:



- Summarisation

- Classification

- Keyword/tag extraction

- FAQ generation

- Learning-objective generation

- Module suggestions

- Assessment-question suggestions

- Knowledge-gap detection



For videos:



Video → Transcription → Topic Segmentation → Timeline → Key Snippets → Suggested Modules



Allow users to view relevant video timestamps/snippets.



AI-generated content must retain source references.



---



5. HUMAN APPROVAL



Add review workflows for Manager, HR or SME.



Reviewer can:



- Review

- Edit

- Approve

- Reject

- Request changes

- Publish



Every approved content item must maintain:



- Version

- Reviewer

- Approval timestamp

- Source

- AI/model metadata where applicable

- Change history



Never silently replace approved content with AI-generated content.



---



6. NEW JOINER ONBOARDING



New Joiner profile should include:



- Name

- Employee/Intern type

- Role

- Team

- Tribe

- Unit

- Joining date

- Experience level

- Manager

- Buddy

- Required onboarding path



Generate a learning journey based on profile.



Use a hybrid model:



Mandatory



Organisation/team/policy/compliance modules.



Role-based



Technical/functional modules relevant to the person's role.



Experience-based



Fresher, experienced hire, intern or internal transfer.



Managers/HR can modify and approve the generated journey.



---



7. LEARNING MODULES



Each module should support:



- Overview

- Learning objectives

- Content

- Documents

- Videos

- Video snippets

- Links/resources

- FAQs

- AI Mentor access

- Assessment

- Completion status



Module states:



Not Started → In Progress → Assessment Pending → Passed → Completed



Track:



- Progress %

- Time spent

- Attempts

- Assessment score

- Completion date



---



8. AI ONBOARDING MENTOR



Add/refine the chatbot as the AI Onboarding Mentor.



Purpose:



«First point of contact for onboarding questions and guidance, reducing repetitive Buddy/Manager support.»



Flow:



User Question → Intent → Approved Knowledge → Answer → Source → Recommended Next Step



The AI should:



- Answer onboarding questions

- Explain processes

- Find relevant policies

- Recommend modules

- Link relevant documents

- Point to relevant video timestamps

- Recommend next steps

- Escalate unanswered questions



AI Guardrails



Default to approved organisational knowledge only.



Never fabricate policies, processes or organisational information.



If knowledge is unavailable:



«"I couldn't find this in the approved onboarding knowledge base. Please contact your Manager, HR or relevant SME."»



Show source/citation and knowledge version where possible.



Support:



- Role-based knowledge access

- PII protection

- Sensitive-data controls

- Prompt-injection protection

- Confidence threshold

- Human escalation

- AI response feedback



---



9. ASSESSMENTS



Support assessments after functional/technical modules.



Types:



- MCQ

- Multiple-select

- True/False

- Scenario-based

- Short answer

- Practical/technical task



Track:



- Score

- Attempts

- Pass/fail

- Completion

- Retry status



AI may suggest questions, but authorised humans must approve mandatory assessments.



---



10. DASHBOARDS



New Joiner Dashboard



Show:



- Welcome/onboarding overview

- Overall progress

- Current module

- Upcoming modules

- Pending assessments

- Completed modules

- Recommended next step

- AI Mentor

- Important announcements/resources



---



Manager / HR Dashboard



Show:



- New joiners

- Joining timeline

- Progress

- Completion %

- Overdue modules

- Assessment performance

- At-risk learners

- Frequently asked questions

- AI escalations

- Buddy intervention trends

- Knowledge gaps



---



SME / Content Owner Dashboard



Show:



- Content awaiting review

- AI-generated suggestions

- Modules requiring approval

- Assessment questions

- Content expiry/review dates

- Feedback

- Knowledge gaps



---



Admin Dashboard



Manage:



- Organisation

- Units

- Tribes

- Teams

- Roles

- Users

- Permissions

- Knowledge sources

- AI controls

- Integrations

- Audit logs

- Configuration



---



11. AUDIT TRAIL



Create a central audit system.



Record:



Who + What + When + Action + Source + Before/After where applicable



Track:



- Uploads

- Edits

- AI generation

- Approvals

- Rejections

- Publishing

- Version changes

- User access

- Assessment attempts

- AI interactions/events

- Permission changes

- Configuration changes

- Content archival



Provide filtering by user, team, action, date and resource.



---



12. AI GOVERNANCE



Create an AI Controls area for authorised Admins.



Include:



- AI model configuration

- Prompt/version tracking

- Approved knowledge sources

- Restricted sources

- Confidence thresholds

- Human approval rules

- AI usage metrics

- AI feedback

- Response evaluation

- PII/sensitive-data controls

- AI activity logs



Do not expose sensitive AI configuration to normal users.



---



13. REPORTING & ANALYTICS



Provide reports for:



Learner



Progress, completion, scores, attempts, difficult modules and questions.



Manager/HR



Team completion, overdue modules, at-risk learners, common questions and onboarding effectiveness.



Organisation



Cross-team completion, content effectiveness, knowledge gaps, AI usage and onboarding trends.



Use clear charts/cards/tables with useful filtering.



---



14. KNOWLEDGE GAP LOOP



Detect:



- Repeated questions

- Unanswered questions

- Low-confidence answers

- Outdated content

- Frequently accessed but poorly rated content



Flow:



Usage → AI Analysis → Knowledge Gap → Content Recommendation → SME Review → Approval → Published Knowledge



---



15. CONTENT LIFECYCLE



Every knowledge item/module should support:



- Owner

- Version

- Status

- Effective date

- Last reviewed

- Next review

- Expiry/archive

- Change history



Surface content requiring review.



---



16. RBAC



Implement role-based access.



New Joiner



Own onboarding, learning, assessments and AI Mentor.



Manager / HR



Team onboarding, approvals, progress and reports.



SME



Assigned content and assessment approval.



Admin



Platform-wide governance and configuration.



Users must only see data/content permitted for their organisation/team/role.



---



17. UX / UI DIRECTION



Redesign the existing UI to feel:



Modern + Premium + Enterprise + Simple



Avoid:



- Overcrowded dashboards

- Excessive cards

- Unnecessary gradients

- Decorative UI without purpose

- Large blocks of text

- Inconsistent spacing

- Excessive animations



Use:



- Clear hierarchy

- Consistent spacing

- Strong typography

- Meaningful status indicators

- Tables where appropriate

- Cards only when useful

- Responsive layouts

- Accessible contrast

- Empty/loading/error states

- Consistent navigation



Maintain the existing brand identity where appropriate.



---



18. NAVIGATION



Recommended primary navigation:



Dashboard



Onboarding



- My Journey

- Modules

- Assessments

- Resources



AI Mentor



Knowledge Hub



Content Review



People / Teams



Reports & Analytics



Audit Trail



AI Controls



Administration



Show navigation based on RBAC.



---



19. IMPORTANT PRODUCT PRINCIPLES



1. AI suggests; humans approve.

2. Approved knowledge is the source of truth.

3. AI must not hallucinate organisational policies/processes.

4. Every important content change is versioned and auditable.

5. Learning journeys should be personalised but retain mandatory modules.

6. Buddy support should become escalation/mentoring, not repetitive training.

7. Design for Organisation → Unit → Tribe → Team scalability.

8. Do not expose information outside a user's permissions.

9. Do not remove existing working functionality without validating its purpose.

10. Prioritise a coherent end-to-end experience over adding isolated features.



---



20. IMPLEMENTATION APPROACH



Before changing the application:



1. Inspect the existing codebase.

2. Identify current pages, routes, components, data models and integrations.

3. Map existing functionality to the requirements above.

4. Reuse existing components where practical.

5. Identify gaps.

6. Refactor duplicated/inconsistent components.

7. Implement the redesigned information architecture.

8. Preserve working functionality.

9. Add missing states: loading, empty, error, success and permission denied.

10. Ensure responsive desktop/tablet/mobile behaviour.

11. Validate navigation and role-based access.

12. Ensure tONBOARDING MENTOR — PRODUCT REDESIGN & REFACTOR



Objective



Redesign and refactor the existing Onboarding Mentor application into an enterprise-ready, AI-powered onboarding and knowledge platform.



Important: This is an enhancement of the existing codebase. First inspect the current application, routes, components, data models, and existing functionality. Reuse working functionality where possible. Do not rebuild unnecessarily or remove existing features without reason.



Priorities:



1. Clean, modern enterprise UX

2. Clear role-based workflows

3. Knowledge → AI Processing → Approval → Learning → AI Mentor → Assessment → Analytics

4. Scalable multi-team/unit architecture

5. Strong AI governance, RBAC and auditability

6. Responsive and accessible UI



---



1. PRODUCT MODEL



The platform supports onboarding at:



Organisation → Unit → Tribe → Team → Role



Primary users:



- New Joiner / Employee / Intern

- Manager / HR

- SME / Content Owner

- Admin



The platform has 3 core layers:



Knowledge Layer



Documents, videos, policies, SOPs, FAQs, internal websites and training material.



Learning Layer



Modules, personalised journeys, assessments and progress.



Assistance Layer



AI Onboarding Mentor for contextual Q&A and guidance.



---



2. CORE WORKFLOW



Implement the following lifecycle:



Knowledge Source

→ AI Processing

→ AI Suggestions

→ Human Review

→ Approval

→ Published Knowledge

→ Module Creation

→ Personalised Learning Journey

→ New Joiner Learning

→ AI Mentor Assistance

→ Assessment

→ Completion

→ Analytics

→ Feedback / Knowledge Gaps

→ Content Improvement



AI must suggest, while authorised humans approve important organisational content before publication.



---



3. KNOWLEDGE HUB



Create/refine a central Knowledge Hub.



Supported content:



- PDF

- DOC/DOCX

- PPT/PPTX

- XLS/XLSX

- Images/OCR

- Video

- Audio

- Internal websites

- Policies

- SOPs

- FAQs

- Training material



Each knowledge item should support:



- Title

- Type

- Owner

- Team/Unit

- Category

- Tags

- Version

- Status

- Created/updated date

- Last reviewed date

- Review due date

- Source

- Approval status



Statuses:



Draft → AI Processed → Pending Review → Approved → Published → Review Due → Archived



---



4. AI CONTENT PROCESSING



For uploaded content, show AI processing states and results.



AI capabilities:



- Summarisation

- Classification

- Keyword/tag extraction

- FAQ generation

- Learning-objective generation

- Module suggestions

- Assessment-question suggestions

- Knowledge-gap detection



For videos:



Video → Transcription → Topic Segmentation → Timeline → Key Snippets → Suggested Modules



Allow users to view relevant video timestamps/snippets.



AI-generated content must retain source references.



---



5. HUMAN APPROVAL



Add review workflows for Manager, HR or SME.



Reviewer can:



- Review

- Edit

- Approve

- Reject

- Request changes

- Publish



Every approved content item must maintain:



- Version

- Reviewer

- Approval timestamp

- Source

- AI/model metadata where applicable

- Change history



Never silently replace approved content with AI-generated content.



---



6. NEW JOINER ONBOARDING



New Joiner profile should include:



- Name

- Employee/Intern type

- Role

- Team

- Tribe

- Unit

- Joining date

- Experience level

- Manager

- Buddy

- Required onboarding path



Generate a learning journey based on profile.



Use a hybrid model:



Mandatory



Organisation/team/policy/compliance modules.



Role-based



Technical/functional modules relevant to the person's role.



Experience-based



Fresher, experienced hire, intern or internal transfer.



Managers/HR can modify and approve the generated journey.



---



7. LEARNING MODULES



Each module should support:



- Overview

- Learning objectives

- Content

- Documents

- Videos

- Video snippets

- Links/resources

- FAQs

- AI Mentor access

- Assessment

- Completion status



Module states:



Not Started → In Progress → Assessment Pending → Passed → Completed



Track:



- Progress %

- Time spent

- Attempts

- Assessment score

- Completion date



---



8. AI ONBOARDING MENTOR



Add/refine the chatbot as the AI Onboarding Mentor.



Purpose:



«First point of contact for onboarding questions and guidance, reducing repetitive Buddy/Manager support.»



Flow:



User Question → Intent → Approved Knowledge → Answer → Source → Recommended Next Step



The AI should:



- Answer onboarding questions

- Explain processes

- Find relevant policies

- Recommend modules

- Link relevant documents

- Point to relevant video timestamps

- Recommend next steps

- Escalate unanswered questions



AI Guardrails



Default to approved organisational knowledge only.



Never fabricate policies, processes or organisational information.



If knowledge is unavailable:



«"I couldn't find this in the approved onboarding knowledge base. Please contact your Manager, HR or relevant SME."»



Show source/citation and knowledge version where possible.



Support:



- Role-based knowledge access

- PII protection

- Sensitive-data controls

- Prompt-injection protection

- Confidence threshold

- Human escalation

- AI response feedback



---



9. ASSESSMENTS



Support assessments after functional/technical modules.



Types:



- MCQ

- Multiple-select

- True/False

- Scenario-based

- Short answer

- Practical/technical task



Track:



- Score

- Attempts

- Pass/fail

- Completion

- Retry status



AI may suggest questions, but authorised humans must approve mandatory assessments.



---



10. DASHBOARDS



New Joiner Dashboard



Show:



- Welcome/onboarding overview

- Overall progress

- Current module

- Upcoming modules

- Pending assessments

- Completed modules

- Recommended next step

- AI Mentor

- Important announcements/resources



---



Manager / HR Dashboard



Show:



- New joiners

- Joining timeline

- Progress

- Completion %

- Overdue modules

- Assessment performance

- At-risk learners

- Frequently asked questions

- AI escalations

- Buddy intervention trends

- Knowledge gaps



---



SME / Content Owner Dashboard



Show:



- Content awaiting review

- AI-generated suggestions

- Modules requiring approval

- Assessment questions

- Content expiry/review dates

- Feedback

- Knowledge gaps



---



Admin Dashboard



Manage:



- Organisation

- Units

- Tribes

- Teams

- Roles

- Users

- Permissions

- Knowledge sources

- AI controls

- Integrations

- Audit logs

- Configuration



---



11. AUDIT TRAIL



Create a central audit system.



Record:



Who + What + When + Action + Source + Before/After where applicable



Track:



- Uploads

- Edits

- AI generation

- Approvals

- Rejections

- Publishing

- Version changes

- User access

- Assessment attempts

- AI interactions/events

- Permission changes

- Configuration changes

- Content archival



Provide filtering by user, team, action, date and resource.



---



12. AI GOVERNANCE



Create an AI Controls area for authorised Admins.



Include:



- AI model configuration

- Prompt/version tracking

- Approved knowledge sources

- Restricted sources

- Confidence thresholds

- Human approval rules

- AI usage metrics

- AI feedback

- Response evaluation

- PII/sensitive-data controls

- AI activity logs



Do not expose sensitive AI configuration to normal users.



---



13. REPORTING & ANALYTICS



Provide reports for:



Learner



Progress, completion, scores, attempts, difficult modules and questions.



Manager/HR



Team completion, overdue modules, at-risk learners, common questions and onboarding effectiveness.



Organisation



Cross-team completion, content effectiveness, knowledge gaps, AI usage and onboarding trends.



Use clear charts/cards/tables with useful filtering.



---



14. KNOWLEDGE GAP LOOP



Detect:



- Repeated questions

- Unanswered questions

- Low-confidence answers

- Outdated content

- Frequently accessed but poorly rated content



Flow:



Usage → AI Analysis → Knowledge Gap → Content Recommendation → SME Review → Approval → Published Knowledge



---



15. CONTENT LIFECYCLE



Every knowledge item/module should support:



- Owner

- Version

- Status

- Effective date

- Last reviewed

- Next review

- Expiry/archive

- Change history



Surface content requiring review.



---



16. RBAC



Implement role-based access.



New Joiner



Own onboarding, learning, assessments and AI Mentor.



Manager / HR



Team onboarding, approvals, progress and reports.



SME



Assigned content and assessment approval.



Admin



Platform-wide governance and configuration.



Users must only see data/content permitted for their organisation/team/role.



---



17. UX / UI DIRECTION



Redesign the existing UI to feel:



Modern + Premium + Enterprise + Simple



Avoid:



- Overcrowded dashboards

- Excessive cards

- Unnecessary gradients

- Decorative UI without purpose

- Large blocks of text

- Inconsistent spacing

- Excessive animations



Use:



- Clear hierarchy

- Consistent spacing

- Strong typography

- Meaningful status indicators

- Tables where appropriate

- Cards only when useful

- Responsive layouts

- Accessible contrast

- Empty/loading/error states

- Consistent navigation



Maintain the existing brand identity where appropriate.



---



18. NAVIGATION



Recommended primary navigation:



Dashboard



Onboarding



- My Journey

- Modules

- Assessments

- Resources



AI Mentor



Knowledge Hub



Content Review



People / Teams



Reports & Analytics



Audit Trail



AI Controls



Administration



Show navigation based on RBAC.



---



19. IMPORTANT PRODUCT PRINCIPLES



1. AI suggests; humans approve.

2. Approved knowledge is the source of truth.

3. AI must not hallucinate organisational policies/processes.

4. Every important content change is versioned and auditable.

5. Learning journeys should be personalised but retain mandatory modules.

6. Buddy support should become escalation/mentoring, not repetitive training.

7. Design for Organisation → Unit → Tribe → Team scalability.

8. Do not expose information outside a user's permissions.

9. Do not remove existing working functionality without validating its purpose.

10. Prioritise a coherent end-to-end experience over adding isolated features.



---



20. IMPLEMENTATION APPROACH



Before changing the application:



1. Inspect the existing codebase.

2. Identify current pages, routes, components, data models and integrations.

3. Map existing functionality to the requirements above.

4. Reuse existing components where practical.

5. Identify gaps.

6. Refactor duplicated/inconsistent components.

7. Implement the redesigned information architecture.

8. Preserve working functionality.

9. Add missing states: loading, empty, error, success and permission denied.

10. Ensure responsive desktop/tablet/mobile behaviour.

11. Validate navigation and role-based access.

12. Ensure the application remains functional after each major change.



Do not create mock functionality that appears operational if the underlying feature does not exist. Clearly separate UI placeholders from implemented functionality.



Final Goal



Transform the existing application into a cohesive AI-powered Enterprise Onboarding Mentor where:



Organisational Knowledge → AI Processing → Human Approval → Personalised Onboarding → AI Assistance → Assessment → Completion → Analytics → Continuous Improvement



Keep the experience simple for the New Joiner and powerful for Managers, HR, SMEs and Admins.he application remains functional after each major change.



Do not create mock functionality that appears operational if the underlying feature does not exist. Clearly separate UI placeholders from implemented functionality.



Final Goal



Transform the existing application into a cohesive AI-powered Enterprise Onboarding Mentor where:



Organisational Knowledge → AI Processing → Human Approval → Personalised Onboarding → AI Assistance → Assessment → Completion → Analytics → Continuous Improvement



Keep the experience simple for the New Joiner and powerful for Managers, HR, SMEs and Admins.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dd60e139-67e3-4d6c-af7c-8b3624a1da77).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

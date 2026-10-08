# 🔒 Security Guidelines

## Reporting a Security Concern

Do not publish sensitive security findings in a public channel. Contact the LEAP Young Innovators organizing team or the appropriate internal security contact.

## Mandatory Practices

- Keep this repository private.
- Never commit passwords, tokens, API keys, private keys, certificates, or connection strings.
- Use approved secret-management mechanisms and repository/organization secrets.
- Do not use unauthorized production, customer, employee, personal, or confidential data.
- Use synthetic or formally approved test data.
- Apply least-privilege access.
- Validate and sanitize external input.
- Avoid logging secrets or sensitive data.
- Review open-source packages and document versions and licenses.
- Obtain packages from approved internal repositories when required.
- Review AI-generated code for security, correctness, licensing, and maintainability.

## Before Submission

Check the repository history, not only the latest files, for accidentally committed secrets. If a secret was committed, revoke or rotate it immediately and contact the appropriate support team.

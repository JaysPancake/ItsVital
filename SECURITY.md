# Security Policy

## Overview

ItsVital is a free and open-source, browser-based patient-monitor simulation platform for education and training.

ItsVital is **not a medical device** and must not be used for real patient monitoring, diagnosis, treatment, or clinical decision-making. Security reports involving clinical safety, misleading behavior, unauthorized access, privacy, or data exposure are taken seriously.

## Supported versions

ItsVital is currently in early development and has not reached a stable release.

Until stable releases are published, security fixes will generally be applied only to:

- the latest commit on the default branch;
- the latest publicly hosted version maintained by the project; and
- the most recent tagged release, once releases begin.

Older commits, forks, custom deployments, and modified versions may not receive security updates from the ItsVital maintainers.

## Reporting a vulnerability

Please **do not open a public GitHub issue** for a suspected vulnerability.

Use GitHub's private vulnerability reporting or security-advisory feature for this repository when available:

1. Open the repository's **Security** tab.
2. Select **Advisories**.
3. Choose **Report a vulnerability** or create a private security advisory.

If private vulnerability reporting is unavailable, open a public issue containing only a request for private contact. Do not include exploit details, secrets, personal information, or reproduction steps in that public issue.

A useful report should include:

- a concise description of the vulnerability;
- the affected commit, release, deployment, route, or component;
- clear reproduction steps or a minimal proof of concept;
- the likely impact;
- whether authentication or special configuration is required;
- suggested mitigations, when known; and
- any disclosure deadline that must be considered.

Do not include real patient information, protected health information, production credentials, access tokens, private keys, or other sensitive third-party data in a report.

## What should be reported

Examples include:

- unauthorized instructor or administrative access;
- session takeover, join-code bypass, or privilege escalation;
- exposure of instructor tokens, credentials, secrets, or private configuration;
- cross-session data leakage;
- injection vulnerabilities;
- cross-site scripting or unsafe HTML rendering;
- insecure direct-object references;
- denial-of-service conditions that can be triggered remotely;
- unsafe file upload, import, or scenario parsing behavior;
- vulnerable authentication, authorization, or password-reset behavior;
- accidental storage or logging of sensitive information;
- dependency vulnerabilities with a practical impact on ItsVital;
- misleading monitor behavior that could reasonably cause the software to be mistaken for a clinical tool; and
- defects that bypass safety warnings or training-only boundaries.

## Usually out of scope

The following are generally not treated as security vulnerabilities unless they create a concrete security or privacy impact:

- visual inconsistencies;
- inaccurate simulated physiology without a security or safety-boundary impact;
- missing features documented as incomplete;
- vulnerabilities that require control of the user's device or browser;
- attacks that require a compromised hosting environment;
- rate-limit observations without a demonstrated impact;
- automated dependency reports without evidence that the vulnerable path is reachable;
- social-engineering attacks against maintainers or users;
- issues that affect only an unsupported fork or modified deployment; and
- denial-of-service testing against public infrastructure without prior authorization.

## Safe testing guidelines

Security research must be performed responsibly.

- Test only systems and accounts that you own or have explicit permission to test.
- Prefer a local or self-hosted development environment.
- Do not access, modify, delete, or retain another person's data.
- Do not degrade public services or intentionally exhaust shared resources.
- Do not use destructive payloads.
- Stop testing and report the issue if sensitive information becomes accessible.
- Do not publicly disclose an unpatched vulnerability before maintainers have had a reasonable opportunity to respond.

The maintainers cannot authorize testing against infrastructure operated by third parties.

## Response and disclosure process

The project will make a good-faith effort to:

- acknowledge a complete report within 7 days;
- assess severity and affected components;
- request additional information when necessary;
- develop and test a fix or mitigation;
- coordinate a reasonable disclosure date with the reporter; and
- publish an advisory or release note when appropriate.

These are targets rather than guarantees. Response times may vary because ItsVital is an open-source project maintained with limited resources.

Please allow maintainers time to investigate and release a fix before public disclosure. Reporters are encouraged to coordinate attribution and advisory wording with the maintainers.

## Secrets and configuration

Contributors and deployers must not commit secrets to the repository.

Use environment variables and provide only placeholder values in `.env.example`. This includes:

- database connection strings;
- Supabase service-role keys;
- session-signing secrets;
- OAuth credentials;
- email-provider credentials;
- cloud-service tokens;
- private keys; and
- production URLs containing embedded credentials.

If a secret is committed, assume it has been compromised. Revoke or rotate it immediately; deleting it from a later commit is not sufficient.

## Deployment responsibility

Self-hosted operators are responsible for securing and maintaining their own deployment, including:

- TLS and reverse-proxy configuration;
- operating-system and container updates;
- database access controls and backups;
- secret storage and rotation;
- authentication-provider configuration;
- network exposure;
- monitoring and logging;
- dependency updates; and
- compliance with applicable privacy, education, employment, and healthcare laws.

Do not store real patient data or protected health information in ItsVital unless a future version explicitly supports that use and the deployment has been independently evaluated for the applicable legal, privacy, and security requirements. The current project is intended for fictional training scenarios.

## Clinical-safety boundary

ItsVital must always be clearly presented as a simulation and training platform.

Security and safety reports should be submitted when a defect could:

- remove or obscure training-only warnings;
- expose simulated content as though it were real clinical data;
- allow an unauthorized person to control a learner's monitor;
- cause one session's state to appear in another session; or
- otherwise create a reasonable risk that users misunderstand the tool's purpose or trustworthiness.

Thank you for helping keep ItsVital and its users safe.

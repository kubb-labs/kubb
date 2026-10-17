---
layout: doc
title: Publish Kubb snapshots with GitLab CI
description: Add a GitLab CI job that runs kubb studio snapshot on each merge request and compares the generated files with the target branch and the previous pipeline.
order: 4
navigation:
  title: GitLab CI
  icon: i-simple-icons-gitlab
---

# Publish Kubb snapshots with GitLab CI

Publish an installable Kubb Studio snapshot from GitLab CI so reviewers can compare generated files against the target branch and previous pipelines. Store `KUBB_TOKEN` as a masked CI/CD variable, commit your npm lockfile, and keep `kubb` in the development dependencies so `npm ci` installs the CLI.

<!--@include: ../../snippets/integrations/ci-steps.md-->

::steps{level="2"}

## Configure the job

<!--@include: ../../snippets/integrations/gitlab.md-->

<!--@include: ../../snippets/integrations/ci-review.md-->

::

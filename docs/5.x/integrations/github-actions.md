---
layout: doc
title: Publish snapshots with GitHub Actions
description: Publish Kubb Studio snapshots from GitHub Actions and review generated-file changes.
order: 3
navigation:
  title: GitHub Actions
  icon: i-simple-icons-githubactions
---

# Publish snapshots with GitHub Actions

Publish an installable Kubb Studio snapshot from GitHub Actions so reviewers can compare generated files against the base branch and previous runs. Store `KUBB_TOKEN` as an Actions repository secret.

<!--@include: ../../snippets/integrations/ci-steps.md-->

::steps{level="2"}

## Configure the workflow

<!--@include: ../../snippets/integrations/github-actions.md-->

<!--@include: ../../snippets/integrations/ci-review.md-->

::

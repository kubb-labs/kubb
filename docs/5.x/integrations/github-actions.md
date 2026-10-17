---
layout: doc
title: Publish Kubb snapshots with GitHub Actions
description: Add the kubb-labs/action workflow to publish a Kubb Studio snapshot on each pull request and compare generated files with the base branch and the previous run.
order: 3
navigation:
  title: GitHub Actions
  icon: i-simple-icons-githubactions
---

# Publish Kubb snapshots with GitHub Actions

Publish an installable Kubb Studio snapshot from GitHub Actions so reviewers can compare generated files against the base branch and previous runs. Store `KUBB_TOKEN` as an Actions repository secret.

<!--@include: ../../snippets/integrations/ci-steps.md-->

::steps{level="2"}

## Configure the workflow

<!--@include: ../../snippets/integrations/github-actions.md-->

<!--@include: ../../snippets/integrations/ci-review.md-->

::

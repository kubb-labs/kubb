# Testing Guide: Issue Comment on Release Workflow

This document explains how to test the `issue-comment-on-release.yml` workflow.

## Overview

The workflow automatically comments on issues that have been fixed in a release. It can be triggered in two ways:

1. **Automatically**: When a new release is published
2. **Manually**: Via workflow_dispatch for testing purposes

## Manual Testing (Recommended)

You can test the workflow without waiting for a release by using the manual trigger:

### Steps to Test

1. Go to the Actions tab in GitHub
2. Select "Comment on Issues Fixed in Release" workflow
3. Click "Run workflow"
4. Fill in the inputs:
   - **release_tag**: Use a recent release tag (e.g., `kubb@3.0.146`)
   - **dry_run**: Check this box to test without posting actual comments

### Example Test Runs

#### Dry Run Test (Safe - No Comments Posted)
```yaml
Inputs:
  release_tag: "kubb@3.0.146"
  dry_run: true
```
This will:
- ✅ Extract PR numbers from the release
- ✅ Find linked issues
- ✅ Log what comments would be posted
- ❌ NOT post actual comments

#### Live Test (Posts Real Comments)
```yaml
Inputs:
  release_tag: "kubb@3.0.146"
  dry_run: false
```
⚠️ **Warning**: This will post real comments on issues!

## What the Workflow Tests

The workflow validates:

1. **PR Extraction**: Finds PR numbers from release notes (e.g., #1234)
2. **Issue Discovery**: Identifies issues linked to PRs via:
   - Keywords: "fixes #123", "closes #456", "resolves #789"
   - Timeline events: Cross-referenced issues
3. **Issue Filtering**: Only comments on closed issues (skips open ones)
4. **Deduplication**: Ensures each issue is commented on only once
5. **Comment Posting**: Creates formatted comments with:
   - Release version
   - Fixing PR number
   - Links to release notes, changelog, and docs

## Expected Output

### Successful Run
```
Processing release: kubb@3.0.146 (kubb@3.0.146)
Found 3 PRs in release notes
Checking PR #1234: Fix serverIndex bug
Checking PR #5678: Update dependencies
Found 2 issues to comment on
🧪 DRY RUN MODE - No comments will be posted
🧪 [DRY RUN] Would comment on issue #123:
🎉 This issue has been resolved in version **kubb@3.0.146**!

The fix was included in PR #1234.

For more details, check out:
- 📦 [Release Notes](https://github.com/kubb-labs/kubb/releases/tag/kubb%403.0.146)
- 📖 [Changelog](https://kubb.dev/changelog)
- 📚 [Documentation](https://kubb.dev)

Thank you for reporting this issue!
---
Finished processing all issues
```

## Logic Validation Tests

The core logic has been validated with unit tests:

- ✅ PR number extraction from release notes
- ✅ Issue pattern matching (fixes, closes, resolves)
- ✅ Case-insensitive keyword matching
- ✅ Multiple issues in one PR
- ✅ Map-based deduplication
- ✅ Standalone issue references (#123)

## Troubleshooting

### No PRs Found
- Check that the release notes contain PR references (e.g., #1234)
- Changesets should automatically include PR numbers

### No Issues Found
- Verify PRs have issue references in title/body
- Check that issues are actually closed
- Look for keywords: fixes, closes, resolves

### Permission Errors
- Ensure the workflow has correct permissions:
  - `issues: write`
  - `pull-requests: read`

## Production Use

Once tested, the workflow will automatically run when:
- A new release is published via the Release workflow
- Changesets creates the release with PR information
- The workflow processes all PRs and comments on fixed issues

No manual intervention needed for production use!

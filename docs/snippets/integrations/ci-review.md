## Review and install the result

Studio has no diff view for snapshots. The GitHub Action lists the changed generated files in its pull request comment, and `kubb studio snapshot --json` reports them in `changes` and `branchChanges` with any provider. To consume the generated package, follow [Install the snapshot](/docs/5.x/integrations/ci#install-the-snapshot).

> [!NOTE]
> Snapshots expire after seven days. Schedule a default-branch run if it can go a week without a push.

## Contribution Notes

Mistakes are allowed. :-)

Just use:

    git stash
    git revert <tag>
    git commit -am 'reverting to <tag>'
    git push origin master
    git pop

and continue working until the problem is resolved.

When you think the issue is corrected then commit normally.  If the issue isn't resolved, just repeat the first step.
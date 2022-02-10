# add-issue-to-projects-beta action

1. to get started, create a [Personal Access Token](https://github.com/settings/tokens)
   1. for project boards under a _user_, be sure to give the token full repo rights
   2. for project boards under an _organization_, be sure to give read/write org permissions
2. add the token to your repo's actions' secrets as `TOKEN`
3. add the action

```yml
name: Add new issues to project board
on:
  issues:
    types:
      - opened
jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - name: Add Issue to Project
        uses: josefaidt/add-issue-to-projects-beta@v1
        with:
          github-token: ${{ secrets.TOKEN }}
          project-number: 2
          project-owner: 'josefaidt'
```

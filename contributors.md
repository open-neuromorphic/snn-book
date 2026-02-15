---
numbering:
  title: false
---
(contributors)=
# Guidelines for Contributors

This page explains what and how to contribute to this **Practical Spiking Neural
Networks** book. It also sets the writing/programming standards, as well as, how
your contributions will be acknowledged and the criteria for it; these details
are subject to change.

This open-source book is primarily written in
[Markdown using Myst](https://mystmd.org). The light-weight code examples are
written in Python using [Numpy](https://numpy.org/).

## What to contribute?

As of this writing (2025), this **Practical SNN** book (or just the "SNN book"
informally) is in a nascent stage; a lot of contents are yet to be added -- from
foudational theories to neuromorphic hardware deployments. Therefore, if you have
some expertise on certain sections of this book and wish to write about it, or
propose new sections, please get in touch with us on the
[Open Neuromorphic Discord](https://discord.gg/hUygPUdD8E). We invite
and appreciate all contributions to perfect this book, no matter their scale!

### Broad areas to contribute:
* Finding and reporting typos -- as [issues](
https://github.com/open-neuromorphic/snn-book/issues) on this repo
* Reviewing the existing content and reporting any conceptual mistakes on ONM's
  Discord channel: `#snn-book`
  * If validated there, a GitHub issue will be created to amend the content
* Fixing existing [issues](https://github.com/open-neuromorphic/snn-book/issues)
  on this repo
  * Mention the issue number your are interested in, on the `#snn-book` channel
  and we will officially assign that issue to you
* Adding new chapters, sections, or light-weight code/programs (in PyTorch, Jax)
* Suggesting (classical) research papers providing in-depth coverage of a certain 
  topic, which we can refer the readers to. 

**NOTE:** Please check the following section: **1. 4 Call for planned
contributions** for more concrete opportunities to contribute to this book!

## How to contribute?

Interested to contribute via _writing_ or _reviewing_? Thank you! Please get in 
touch with us to access the GitHub repository, then read the following 
instructions to quickly set up your development environment and push your first 
commit!

### Only two pedantic asks!
Please configure your favourite text editor (where you plan to add your edits to
this book) such that the individual lines (including code snippets) are 80
characters long; most of the editors come with the auto-wrap functionality, you
just need to configure it to 80 characters long.

For coding/programming contributions, we follow Python's [PEP 8](
https://peps.python.org/pep-0008/) formatting. If you are aware of it, that's
great, otherwise, we can help you learn it during the review phase of your edits.

### Next steps?
We suggest you begin with installing a python3 environment and activating it
before executing the following steps.

* Clone this repo: <br>
`git clone git@github.com:open-neuromorphic/snn-book.git` <br> <br>

* Install the required libraries: <br>
`pip install -r requirements.txt` <br> <br>

* Creating a branch (pertaining to an issue, say 17): <br>
`git branch <branch-name>` <br>
`git checkout <branch-name>` <br> <br>

* Set your local branch to track **its own** remote: <br>
`git push --set-upstream origin <branch-name>` <br> <br>

* Make small edits, and compile the book: <br>
`jupyter book start` <br>
from within your python environment, and open <br>
`http://localhost:3000/` <br>
on your browser to see how it looks. <br> <br>

* Once you have made your changes, push your commits: <br>
`git push` <br>
You will see that these will be pushed to your remote branch `<branch-name>` (not
`main`). <br> <br>

* Keep developing your branch as needed, and keep pushing your commits to remote.
<br> <br>

* Once all the necessary changes have been made, and your branch to ready to be
merged to `main`, fetch `main` and rebase against it (make sure your working
directory is clean, i.e., all your files are committed and pushed to remote
`<branch-name>`); while rebasing, resolve the merge conflicts if any: <br>
`git fetch origin main` <br>
`git rebase origin/main` <br> <br>

* Once you have resolved all the merge conflicts, push your local branch: <br>
`git push origin <branch-name>` <br> <br>

* File a pull request upon successful push, and choose a reviewer for your edits;
consult in the `#snn-book` channel for the same! <br> <br>

* Once you've addressed all the review comments and received approval from your
reviewer(s), merge your branch to `main` (assuming no conflicts exist).

**NOTE:** Unless already discussed with repo maintainers/reviewer(s) please do
not add massive changes to review.


## Getting acknowledged!
There are two planned ways for your contributions to be acknowledged on snn-book:

* Any contribution, e.g., code, fixing typos, adding contents, basically any Git
commit will be acknowledged on the GitHub page and for perpetuity in the git log.

* Significant contributions of large chunks of work, e.g., adding an important
section(s) in a chapter, writing a chapter, etc., will be acknowledged as sharing
authorship of a chapter (that will be citable) subject to the approval of the
existing authors of the intended chapter (where your contributions are aimed to)
and the editors. For contributions in this direction, it is advisable to get in
touch with this SNN book's editors first.

**NOTE**: Any other modes of contributions, e.g., planning this book,
advising/ideas on new chapters, joining and contributing to meetings/discussions
will also be acknowledged (in a separate page on this repo) subject to the
editors approval. All these means of acknowledgements are subject to change if
the SNN books editors deem necessary.

## Call for planned contributions
Following are the chapters where we call for contributions. Please get in touch
with the editors on `#snn-book` channel on
[ONM Discord](https://discord.gg/hUygPUdD8E) to plan well, before any Git
activity. [ We will populate the remaining of this section once our book is
public ].

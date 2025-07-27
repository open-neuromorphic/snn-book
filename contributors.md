---
numbering: false
---
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

**NOTE:** Please check the following section: **1. 4 Call for planned
contributions** for more concrete opportunities to contribute to this book!

## How to contribute?

Interested to contribute? Thank you! Please read the following instructions to
quickly set up your dev environment and push your first commit!

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

* Clone this repo <br>
`git clone git@github.com:open-neuromorphic/snn-book.git` <br> <br>

* Install the required libraries<br>
`pip install -r requirements.txt` <br> <br>

* Creating a branch (pertaining to an issue, say 17) and set it to track `main`
  <br>
`git branch issue-17` <br>
`git checkout issue-17` <br>
`git push --set-upstream origin issue-17` <br> <br>

* Make small edits, compile the book <br>
`jupyter book start` <br>
from within your python environment, and open <br>
`http://localhost:3000/` <br>
on your browser to see how it looks <br> <br>

* Once you have made your changes, push your commits to review <br>
`git push` <br> <br>

* File a pull request, and choose a reviewer for your edits; consult in the
`#snn-book` channel for the same! <br> <br>

* Once you've addressed all the review comments and received approval from your
  reviewer(s), merge your branch to `main`

**NOTE:** Unless already discussed with repo maintainers/reviewer(s) please do
not add massive changes to review.


## Getting acknowledged!
Any contribution will be acknowledged on the GitHub page and for perpetuity in the git
log.
If you are contributing large chunks of the work, please get in touch with the
editors to discuss authorship and proper acknowledgements.

## Call for planned contributions
Become a reviewer!

# Practical guide to SNNs

This book is a hands-on introduction to biologically-inspired neural networks *in practice*.
Reading this book will give you means to **design**, **build**, and **execute** spiking neural networks **in simulation** and **in hardware**.

## Building the book

The book can be consumed as a static PDF and as a dynamic website.
The original source code is written in Latex (in `book/latex`), but with small [templated annotations](https://mustache.github.io/) to enrich the text with dynamical content.
From there, we generate template-free LaTeX code, which in turn is compiled to a PDF.
For the website, we convert the LaTeX code to Markdown, which in turn is built into a [Jupyter book](https://jupyterbook.org/).

Luckily, we have built a script that takes care of all this. You will need to 
1. Install the Python dependencies in `requirements.txt`,
2. Install Latexmk and Pandoc, and
3. run the script in `book/generate/generate.py`.

Here are the setup steps for Ubuntu to install the requirements and build the book locally:

```bash
apt install latexmk pandoc fonts-inconsolata # Install system dependencies
pip install -r requirements.txt              # Install python requirements
# Build the book from source (in book/latex) to a target directory
python3 book/generate/generate.py book/latex --target book/build 
```

## Acknowledgements (in alphabetic order)

* Petrut Bogdan
* Ramashish Gaurav
* Jens Egholm Pedersen
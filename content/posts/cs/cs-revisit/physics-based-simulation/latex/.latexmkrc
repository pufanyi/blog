# Use XeLaTeX by default for full CJK (ctex) and Unicode support.
$pdf_mode = 5;
$xelatex = 'xelatex -interaction=nonstopmode -halt-on-error -synctex=1 %O %S';

# Use Biber for biblatex bibliography processing.
$biber = 'biber %O %B';

# Keep intermediate build files and output PDF in build/.
$out_dir = 'build';

# Allow enough passes for cold builds with nested \include, biber, and bookmarks.
$max_repeat = 7;

# Clean extra generated files on `latexmk -c` / `-C`.
$clean_ext = 'bbl nav out snm run.xml xdv synctex.gz';

MAIN := main
OUT_DIR := build
PDF := $(OUT_DIR)/$(MAIN).pdf
PUBLISHED_PDF := ../physics-based-simulation.pdf

.PHONY: all watch clean distclean

all:
	latexmk $(MAIN).tex
	cp $(PDF) $(PUBLISHED_PDF)

watch:
	latexmk -pvc $(MAIN).tex

clean:
	latexmk -c $(MAIN).tex

distclean:
	latexmk -C $(MAIN).tex
	rm -rf $(OUT_DIR)

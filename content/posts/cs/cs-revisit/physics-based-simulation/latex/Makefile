MAIN := main
OUT_DIR := build
PDF := $(OUT_DIR)/$(MAIN).pdf

.PHONY: all watch clean distclean

all: $(PDF)

$(PDF):
	latexmk $(MAIN).tex

watch:
	latexmk -pvc $(MAIN).tex

clean:
	latexmk -c $(MAIN).tex

distclean:
	latexmk -C $(MAIN).tex
	rm -rf $(OUT_DIR)
